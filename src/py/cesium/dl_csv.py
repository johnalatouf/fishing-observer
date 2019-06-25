import pandas as pd
import solrEscapes
import json
import sys
import os.path
import get_ship_data
import re
import pysolr
import csv
import shardDict
from datetime import datetime

# make sure the username exists
def checkUsername(username):
    solr = pysolr.Solr('localhost:8983/solr/users', timeout=7000)
    search = 'id:%s' % solrEscapes.solr_escape(username)
    results = solr.search(search)

    for result in results:
        if result['id'] == username and result['admin_status'] == 2:
            return 0
        elif result['id'] == username:
            return 1

    return 0

# save a whole month, just copy existing csv
def download_full_month(open_path, save_path, open_file, username, time):
    chunksize = 2000000
    csv_open = '%s/%s' % (open_path, open_file)
    csv_save = '%s/%s/%s' % (save_path, username, open_file)
    TextFileReader = pd.read_csv(csv_open, chunksize=chunksize)
    df = pd.concat(TextFileReader, ignore_index=True)
    df.to_csv(csv_save, sep=',', encoding='utf-8',  index = False)
    append_disclaimer(csv_save)
    os.chmod(csv_save, 0644)

    return csv_save


# get monthly data from solr
# gets solr points and puts them in dataframe
def month_points_solr(dtfrom, open_path, save_path, open_file, username, time, dts_high=3000000.0, dts_low=0.0):


    data = pd.DataFrame()
    shard_year = int(dtfrom.split('-')[0])
    shard_month = int(dtfrom.split('-')[1])
    date_start = dtfrom.split('T')
    points = 0

    end_day = '31'

    if span == 'month':
        if shard_month in [4, 6, 9, 11]:
            end_day = '30'
        elif shard_month == 2:
            end_day = '28'
    elif span == 'week':
        end = int(date_start.split('-')[2]) + 6
        if end > 30 and shard_month in [4, 6, 9, 11]:
            end_day = '30'
        elif end > 31 and shard_month in [1, 3, 5, 7, 8, 10, 12]:
            end_day = '31'
        elif end > 28 and shard_month == 2:
            end_day = '28'
        else:
            end_day = end_day.zfill(2)


    dtto = '%s-%s-%sT23:59:59Z' % (dtfrom.split('-')[0], dtfrom.split('-')[1], end_day)

    solr = pysolr.Solr('localhost:8983/solr/ee2013', timeout=7000)
    shards = ''

    solr_string = ''

    # avoid having to search extra shards to save time
    if shard_month < 10:
        year_and_month = str(shard_year) + '-0' + str(shard_month)
    else:
        year_and_month = str(shard_year) + '-' + str(shard_month)
    if year_and_month in shardDict.shardDict.keys():
        # print '%s in shardDict.shardDict.keys()' % year_and_month
        shards_entry = shardDict.shardDict[year_and_month]
        solr_string = shards_entry['solr']
        shards = shards_entry['shard']
        solr = pysolr.Solr(solr_string, timeout=7000)
        # print shards_entry

    search = 'datetime:[%s TO %s] AND fishing_f:* AND distshore_f:[%s TO %s]' % (
        dtfrom, dtto, dts_low, dts_high)

    cm = "*"
    results = True
    daycount = -1

    print search

    if shards:
        # print shards
        shardsplit = shards.split(',')
        for sh in shardsplit:
            # print sh
            cm = "*"
            results = True
            solr = pysolr.Solr(sh, timeout=7000)
            while (results):
                results = solr.search(search,
                                  **{'sort': 'datetime asc, unq_id asc', 'cursorMark': cm, 'rows': 50000})
                # just make the results a dataframe for speed
                points += len(results)
                # print '%s points' % points
                if points%50000 == 0:
                    print '%s points' % points

                if len(results) > 0:
                    df = pd.DataFrame(results.docs)
                    data = pd.concat([data, df])
                if results.nextCursorMark is not None:
                    cm = results.nextCursorMark
                else:
                    break
    else:
        while (results):
            results = solr.search(search,
                                  **{'sort': 'datetime asc, unq_id asc', 'cursorMark': cm, 'rows': 50000})
            # just make the results a dataframe for speed
            points += len(results)
            # print '%s points' % points
            if points % 50000 == 0:
                print '%s points' % points

            if len(results) > 0:
                df = pd.DataFrame(results.docs)
                # print df
                data = pd.concat([data, df])
            if results.nextCursorMark is not None:
                cm = results.nextCursorMark
            else:
                break

    if len(data.index) > 0:
        data.mmsi = data.mmsi.astype(str)
        data = data[['mmsi','datetime','longitude','latitude', 'sog', 'cog', 'fishing_f','distshore_f']]

        data = itu_solr(data)

    # print data
    line = re.sub('-', '', open_file)
    line = line + '01'
    csv_save = '%s/%s/m_%s_%s_%s_%s.csv' % (save_path, username, line, int(dts_low / 1000), int(dts_high / 1000), time)

    data.to_csv(csv_save, sep=',', encoding='utf-8', index=False)
    append_disclaimer(csv_save)
    os.chmod(csv_save, 0644)

    return csv_save


# gets ourlabel for each ship and applies to dataframe
def itu_solr(df):

    # get the unique mmsis
    mmsi_list = df.mmsi.unique()
    mmsis = ' '.join(str(x) for x in mmsi_list)


    solr_itu = pysolr.Solr('localhost:8983/solr/itu', timeout=3000)
    # search for the names of each ship
    data = pd.DataFrame()

    # search_names = 'mmsi:(%s)' % (mmsis)
    search_names = '%s' % (mmsis)
    results = solr_itu.search(search_names,
                                   **{'rows': len(mmsis) * 5})

    if len(results) > 0:
        # df = pd.DataFrame(results.docs)
        # print df
        data = pd.DataFrame(results.docs)


        data = data[['mmsi', 'ourlabel', 'name']]

        data.name = data.name.apply(' '.join)
        data.mmsi = data.mmsi.astype(str).map(lambda x: x.lstrip('[u\'').rstrip('\']').encode("utf-8"))
        data.ourlabel = data.ourlabel.astype(str).map(lambda x: x.lstrip('[u\'').rstrip('\']').encode("utf-8"))

        # clean up duplicates
        data = data.drop_duplicates()

        # print data.duplicated()
    result = pd.merge(df, data, how='inner', on='mmsi')

    return result

# save a whole month, just copy existing csv
def download_modified_month(open_path, save_path, open_file, username, time, dts_high=3000000.0, dts_low=0.0):
    chunksize = 2000000
    csv_open = '%s/%s.csv' % (open_path, open_file)
    line = re.sub('-', '', open_file)
    line = line + '01'
    csv_save = '%s/%s/m_%s_%s_%s_%s.csv' % (save_path, username, line, int(dts_low/1000), int(dts_high/1000), time)
    TextFileReader = pd.read_csv(csv_open, chunksize=chunksize)
    df = pd.concat(TextFileReader, ignore_index=True)

    df = df[df['distshore_f'] >= dts_low]
    df = df[df['distshore_f'] <= dts_high]

    df.to_csv(csv_save, sep=',', encoding='utf-8',  index = False)
    append_disclaimer(csv_save)
    os.chmod(csv_save, 0644)

    return csv_save


# save the snapshot data
def download_snapshot(save_path, username, dtfrom, pos1, pos2, time, span='month', mmsis='all', dts_high=3000000.0, dts_low=0.0):

    data = get_ship_data.ship_points_solr(dtfrom, pos1, pos2, span, mmsis, dts_high, dts_low, True)
    date = dtfrom.split('T')[0]
    date = re.sub('-', '', date)
    csv_save = '%s/%s/s_%s_%s_%s_%s.csv' % (save_path, username, date, int(dts_low/1000), int(dts_high/1000), time)
    data.to_csv(csv_save, sep=',', encoding='utf-8',  index = False)
    append_disclaimer(csv_save)
    os.chmod(csv_save, 0644)


    return csv_save

# save the monthly activity for this vessel
def download_vessel_month(save_path, username, dtfrom, mmsi, time, span='month', dts_high=3000000.0, dts_low=0.0, pos1='-90.0,-180.0', pos2='90.0,180.0'):
    data = get_ship_data.ship_points_solr(dtfrom, pos1, pos2, span, mmsi, dts_high, dts_low, True)
    date = dtfrom.split('T')[0]
    date = re.sub('-', '', date)
    csv_save = '%s/%s/v_%s_%s_%s_%s.csv' % (save_path, username, date, int(dts_low/1000), int(dts_high/1000), time)
    data.to_csv(csv_save, sep=',', encoding='utf-8',  index = False)

    os.chmod(csv_save, 0644)
    append_disclaimer(csv_save)
    return csv_save


def append_disclaimer(filename):
    f = open(filename, 'a')
    fd = csv.writer(f)
    fd.writerow(['This publication draws on Satellite AIS data which are provided by exactEarth Ltd. 2017, and processed courtesy of MEOPAR'])
    f.close()


if __name__ == "__main__":
    try:
        dtfrom = solrEscapes.solr_escape_date(sys.argv[1])  # the start date
        path = sys.argv[2]                                  # the path to csv's
        mmsis = solrEscapes.solr_escape(sys.argv[3])        # mmsi's to search, 'all' if all
        dts_high = float(sys.argv[4])                       # distance to shore high
        dts_low = float(sys.argv[5])                        # distance to shore low
        span = sys.argv[6]                                  # 'month' or 'week' = one at a time
        pos1 = solrEscapes.solr_escape_latlon(sys.argv[7])
        pos2 = solrEscapes.solr_escape_latlon(sys.argv[8])
        save_path = sys.argv[9]                             # where to save the csv's
        username = sys.argv[10]                             # username is the folder for csv's
        csv_type = sys.argv[11]                             # what type of csv to download
        time = sys.argv[12]                                 # time generated

        output = ''

        if checkUsername(username) > 0:

            # make the username directory if none exists
            directory = '%s/%s' % (save_path, username)
            if not os.path.exists(directory):
                os.makedirs(directory)
                os.chmod(directory, 0755)

            if (csv_type == 'vessel'):
                output = download_vessel_month(save_path, username, dtfrom, mmsis, time, span, dts_high, dts_low, pos1, pos2)
            elif (csv_type == 'snapshot'):
                output = download_snapshot(save_path, username, dtfrom, pos1, pos2, time, span, mmsis, dts_high, dts_low)
            else:
                dt = dtfrom.split('T')[0]
                ofile = dt.split('-')[0] + '-' + dt.split('-')[1]
                # output = download_modified_month(path, save_path, ofile, username, time, dts_high, dts_low)
                output = month_points_solr(dtfrom, path, save_path, ofile, username, time, dts_high, dts_low)

            print json.dumps(output)
    except Exception as e:
        #print exceptions to the log
        pathname = os.path.dirname(sys.argv[0]) + str(sys.argv[0])
        called = ''
        for s in sys.argv:
            called += '%s ' % (s)
        logf = open("/data/logspythonwww/log.log", "a")
        logf.write('\n%s: file: %s \n%s \n%s\n' % (str(datetime.now()), os.path.abspath(pathname), called, str(e)))
        logf.close()
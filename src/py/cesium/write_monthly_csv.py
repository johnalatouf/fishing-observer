import pandas as pd
import string
import numpy as np
import solrEscapes
import json
import pysolr
import sys
import shardDict
import os


# gets solr points and puts them in dataframe
def points_solr(dtfrom, span='month'):


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

    search = 'datetime:[%s TO %s] AND fishing_f:* AND distshore_f:[0.0 TO 3000000]' % (
        dtfrom, dtto)

    cm = "*"
    results = True
    daycount = -1


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
    return data

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


        data = data[['mmsi', 'ourlabel']]

        data.mmsi = data.mmsi.astype(str).map(lambda x: x.lstrip('[u\'').rstrip('\']').encode("utf-8"))
        data.ourlabel = data.ourlabel.astype(str).map(lambda x: x.lstrip('[u\'').rstrip('\']').encode("utf-8"))


    result = pd.merge(df, data, on='mmsi')

    return result


# write the dataframe to a csv
def write_csv(save_path, filename, df):
    csv_save = '%s/%s.csv' % (save_path, filename)
    df.to_csv(csv_save, sep=',', encoding='utf-8',  index = False)
    os.chmod(csv_save, 0644)

    return csv_save


if __name__ == "__main__":
    dtfrom = solrEscapes.solr_escape_date(sys.argv[1])  # the start date
    path = sys.argv[2]                                  # the path to csv's

    filename = '%s-%s' % (dtfrom.split('-')[0], dtfrom.split('-')[1])

    df = points_solr(dtfrom)
    df = itu_solr(df)
    write_csv(path, filename, df)

    # # just write these for now
    # dtfrom = '2013-02-01T00:00:00Z'
    # filename = '%s-%s' % (dtfrom.split('-')[0], dtfrom.split('-')[1])
    #
    # df = points_solr(dtfrom)
    # df = itu_solr(df)
    # write_csv(path, filename, df)
    #
    # # just write these for now
    # dtfrom = '2013-03-01T00:00:00Z'
    # filename = '%s-%s' % (dtfrom.split('-')[0], dtfrom.split('-')[1])
    #
    # df = points_solr(dtfrom)
    # df = itu_solr(df)
    # write_csv(path, filename, df)

    # just write these for now
    # dtfrom = '2013-04-01T00:00:00Z'
    # filename = '%s-%s' % (dtfrom.split('-')[0], dtfrom.split('-')[1])
    #
    # df = points_solr(dtfrom)
    # df = itu_solr(df)
    # write_csv(path, filename, df)
    #
    # # just write these for now
    # dtfrom = '2013-05-01T00:00:00Z'
    # filename = '%s-%s' % (dtfrom.split('-')[0], dtfrom.split('-')[1])
    #
    # df = points_solr(dtfrom)
    # df = itu_solr(df)
    # write_csv(path, filename, df)
    #
    # # just write these for now
    # dtfrom = '2013-06-01T00:00:00Z'
    # filename = '%s-%s' % (dtfrom.split('-')[0], dtfrom.split('-')[1])
    #
    # df = points_solr(dtfrom)
    # df = itu_solr(df)
    # write_csv(path, filename, df)

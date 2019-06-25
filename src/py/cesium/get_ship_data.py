import pandas as pd
import string
import numpy as np
import solrEscapes
import json
import pysolr
import sys
import shardDict


# gets ship data from solr
def ship_points_solr(dtfrom, pos1, pos2, span='month', mmsis='all', dts_high=3000000.0, dts_low=0.0, csv=False):


    data = pd.DataFrame()
    shard_year = int(dtfrom.split('-')[0])
    shard_month = int(dtfrom.split('-')[1])
    date_start = dtfrom.split('T')

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

    solr = pysolr.Solr('localhost:8983/solr/ee2012', timeout=7000)
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

    # search = 'datetime:[%s TO %s] AND fishing_f:* AND distshore_f:*' % (
    #     dtfrom, dtto)

    cm = "*"
    results = True
    daycount = -1

    if mmsis != 'all':
        m = string.join(mmsis.split(','), ' ')
        search = 'mmsi:(%s) AND datetime:[%s TO %s] AND fishing_f:* AND distshore_f:[%s TO %s]' % (
            m, dtfrom, dtto, dts_low, dts_high)
        # search = 'mmsi:(%s) AND datetime:[%s TO %s] AND fishing_f:* AND distshore_f:*' % (
        #     m, dtfrom, dtto)

    search_2 = 'latlon:[%s TO %s]' % (pos1, pos2)

    # account for dateline overlaps
    p1 = [float(i) for i in pos1.split(',')]
    p2 = [float(i) for i in pos2.split(',')]
    if p1[1] > p2[1]:       # if the SW corner is further east than the NE
        box1_p1 = p1
        box1_p2 = [p2[0], 180.0]
        box2_p1 = [p1[0], -180.0]
        box2_p2 = p2

        search_2 = 'latlon:[%s,%s TO %s,%s] OR latlon:[%s,%s TO %s,%s]' % (
            box1_p1[0], box1_p1[1], box1_p2[0], box1_p2[1], box2_p1[0], box2_p1[1], box2_p2[0], box2_p2[1] )


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
                                  **{'sort': 'datetime asc, unq_id asc', 'cursorMark': cm, 'rows': 50000,
                                     'fq': search_2})
                # just make the results a dataframe for speed
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
                                  **{'sort': 'datetime asc, unq_id asc', 'cursorMark': cm, 'rows': 50000,
                                     'fq': search_2})
            # just make the results a dataframe for speed
            if len(results) > 0:
                df = pd.DataFrame(results.docs)
                # print df
                data = pd.concat([data, df])
            if results.nextCursorMark is not None:
                cm = results.nextCursorMark
            else:
                break



    # if outside the dts, mark as non-fishing
    # data.loc[data.distshore_f < dts_low, 'fishing_f'] = 0.0
    # data.loc[data.distshore_f > dts_high, 'fishing_f'] = 0.0

    if len(data.index) > 0 and csv == False:
        data = data[['mmsi', 'longitude', 'latitude', 'datetime', 'fishing_f']]
    elif len(data.index) > 0:
        data = data[['mmsi', 'longitude', 'latitude', 'datetime', 'fishing_f', 'distshore_f']]

    return data


# gets ship data from solr
def ship_points(dtfrom, pos1, pos2, span='month', mmsis='all', dts_high=3000000.0, dts_low=0.0, csv=False):


    data = pd.DataFrame()
    shard_year = int(dtfrom.split('-')[0])
    shard_month = int(dtfrom.split('-')[1])
    date_start = dtfrom.split('T')

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

    solr = pysolr.Solr('localhost:8983/solr/ee2012', timeout=7000)
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

    # search = 'datetime:[%s TO %s] AND ( (fishing_f:1 AND distshore_f:([%s TO %s] -1)) OR (fishing_f:0 AND distshore_f:*) )' % (
    #     dtfrom, dtto, dts_low, dts_high)

    # search = 'datetime:[%s TO %s] AND fishing_f:* AND distshore_f:[%s TO %s]' % (
    #     dtfrom, dtto, dts_low, dts_high)

    search = 'datetime:[%s TO %s] AND fishing_f:* AND distshore_f:[0.0 TO 3000000]' % (
        dtfrom, dtto)

    cm = "*"
    results = True
    daycount = -1

    if mmsis != 'all':
        m = string.join(mmsis.split(','), ' ')
        # search = 'mmsi:(%s) AND datetime:[%s TO %s] AND ( (fishing_f:1 AND distshore_f:([%s TO %s] -1)) OR (fishing_f:0 AND distshore_f:*) )' % (
        #     m, dtfrom, dtto, dts_low, dts_high)
        # search = 'mmsi:(%s) AND datetime:[%s TO %s] AND fishing_f:* AND distshore_f::[%s TO %s]' % (
        #     m, dtfrom, dtto, dts_low, dts_high)
        search = 'mmsi:(%s) AND datetime:[%s TO %s] AND fishing_f:* AND distshore_f:[0.0 TO 3000000]' % (m, dtfrom, dtto)

    search_2 = 'latlon:[%s TO %s]' % (pos1, pos2)

    # account for dateline overlaps
    p1 = [float(i) for i in pos1.split(',')]
    p2 = [float(i) for i in pos2.split(',')]
    if p1[1] > p2[1]:       # if the SW corner is further east than the NE
        box1_p1 = p1
        box1_p2 = [p2[0], 180.0]
        box2_p1 = [p1[0], -180.0]
        box2_p2 = p2

        search_2 = 'latlon:[%s,%s TO %s,%s] OR latlon:[%s,%s TO %s,%s]' % (
            box1_p1[0], box1_p1[1], box1_p2[0], box1_p2[1], box2_p1[0], box2_p1[1], box2_p2[0], box2_p2[1] )


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
                                  **{'sort': 'datetime asc, unq_id asc', 'cursorMark': cm, 'rows': 50000,
                                     'fq': search_2})
                # just make the results a dataframe for speed
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
                                  **{'sort': 'datetime asc, unq_id asc', 'cursorMark': cm, 'rows': 50000,
                                     'fq': search_2})
            # just make the results a dataframe for speed
            if len(results) > 0:
                df = pd.DataFrame(results.docs)
                # print df
                data = pd.concat([data, df])
            if results.nextCursorMark is not None:
                cm = results.nextCursorMark
            else:
                break



    # if outside the dts, mark as non-fishing
    data.loc[data.distshore_f < dts_low, 'fishing_f'] = 0
    data.loc[data.distshore_f > dts_high, 'fishing_f'] = 0

    if len(data.index) > 0 and csv == False:
        data = data[['mmsi', 'longitude', 'latitude', 'datetime', 'fishing_f']]
    elif len(data.index) > 0:
        data = data[['mmsi', 'longitude', 'latitude', 'datetime', 'fishing_f', 'distshore_f']]

    return data

# gets the ship data from the csv file into dataframe
def ship_points_csv(dtfrom, csv_file, pos1, pos2, span='month', mmsis='all', dts_high=3000000.0, dts_low=0.0):
    chunksize = 2000000

    points = 0
    data = pd.DataFrame()
    mmsi = ''

    position1 = string.split(pos1, ',')
    position2 = string.split(pos2, ',')

    # escape and validate the date, return nothing if invalid
    dtfrom = solrEscapes.solr_escape_date(dtfrom)
    if dtfrom == '':
        return data

    # escape the mmsis string
    mmsis = solrEscapes.solr_escape(mmsis)

    # read in the chunks and start filtering
    reader = pd.read_csv(csv_file, chunksize=chunksize)

    for results in reader:

        # results = results[results['fishing_f'] > 0]

        # datespan
        if span == 'week':

            # split up the date and get a month length
            year = dtfrom.split('T')[0].split('-')[0]
            month = dtfrom.split('T')[0].split('-')[1]
            month_len = 31
            weeks = 5
            if month in ['01', '03', '05', '07', '08', '10', '12']:
                month_len = 32
            elif month == '02':
                weeks = 4
                month_len = 29

            daycount = month_len - 1

            # split up by week
            count = 0
            start_day = 1
            end_day = 8
            while count < weeks:
                day = []
                for d in range(start_day, end_day):
                    if d > 10:
                        day.append('%s-%s-%s' % (year, month, d))
                    else:
                        day.append('%s-%s-0%s' % (year, month, d))

                dayt = tuple(day)
                results = results[results['datetime'].apply(lambda s: s.startswith(dayt))]

        # filter for latlon area


            # account for dateline overlaps
        p1 = [float(i) for i in pos1.split(',')]
        p2 = [float(i) for i in pos2.split(',')]
        if p1[1] > p2[1]:  # if the SW corner is further east than the NE
            box1_p1 = p1
            box1_p2 = [p2[0], 180.0]
            box2_p1 = [p1[0], -180.0]
            box2_p2 = p2


            r1 = results[results['longitude'].between(float(box1_p1[1]), float(box1_p2[1]), inclusive=True)]
            r1 = r1[r1['latitude'].between(float(box1_p1[0]), float(box1_p2[0]), inclusive=True)]

            r2 = results[results['longitude'].between(float(box1_p2[1]), float(box2_p2[1]), inclusive=True)]
            r2 = r2[r2['latitude'].between(float(box2_p1[0]), float(box2_p2[0]), inclusive=True)]

            results = pd.concat([r1, r2])

        else:
            results = results[results['longitude'].between(float(position1[1]), float(position2[1]), inclusive=True)]
            results = results[results['latitude'].between(float(position1[0]), float(position2[0]), inclusive=True)]

        results.mmsi = results.mmsi.astype(str)

        # for some reason, getting these bad mmsi's, just remove them
        # results = results[results['mmsi'].str.len() > 8]

        # filter the dataframe by distance to shore and mmsis
        results = results[results['distshore_f'] >= dts_low]
        results = results[results['distshore_f'] <= dts_high]
        if mmsis != 'all':
            results = results[results['mmsi'].isin(string.split(mmsis, ','))]

        points += len(results)

        data = pd.concat([data, results])

        # filtered = results[['mmsi', 'longitude', 'latitude', 'datetime', 'ourlabel', 'fishing_f']]
        # if len(data) <= 0:
        #     data = filtered.as_matrix()
        # else:
        #     data = np.append(data, filtered.as_matrix(), axis=0)

    data = data[['mmsi', 'longitude', 'latitude', 'datetime', 'fishing_f']]
    return data

def ship_routes(alldata):
    # print alldata

    # get the mmsi's and use them to filter the dataframe
    mmsi_list = alldata.mmsi.unique()
    routes = {}

    # don't send data for ship types that don't count
    import get_itu_data
    mlist = mmsi_list.astype(str).tolist()
    mmsi_data = get_itu_data.itu_solr(" ".join(mlist))
    # results[results['longitude'].between(float(box1_p2[1]), float(box2_p2[1]), inclusive=True)]
    mmsi_data.ourlabel = mmsi_data.ourlabel.astype(str)

    # # for testing
    # mmsi_data = mmsi_data[mmsi_data['ourlabel'] != '1']
    # mmsi_data = mmsi_data[mmsi_data['ourlabel'] != '0']
    #
    # print mmsi_data
    # # for testing

    # print mmsi_data
    mmsi_data = mmsi_data[mmsi_data['ourlabel'] != '-']
    mmsi_data = mmsi_data[mmsi_data['ourlabel'] != 'nan']
    # print mmsi_data
    mmsi_list = mmsi_data.mmsi.unique()

    for m in mmsi_list:
        df = alldata[alldata['mmsi'] == int(m)]
        df = df[['latitude', 'longitude', 'datetime', 'fishing_f']]
        routes[m] = df.as_matrix().tolist()
        # print routes[m]

    print json.dumps(routes)


if __name__ == "__main__":
    dtfrom = solrEscapes.solr_escape_date(sys.argv[1])  # the start date
    path = sys.argv[2]                                  # the path to csv's
    mmsis = solrEscapes.solr_escape(sys.argv[3])        # mmsi's to search, 'all' if all
    dts_high = float(sys.argv[4])                       # distance to shore high
    dts_low = float(sys.argv[5])                        # distance to shore low
    span = sys.argv[6]                                  # 'month' or 'week' = one at a time
    pos1 = solrEscapes.solr_escape_latlon(sys.argv[7])
    pos2 = solrEscapes.solr_escape_latlon(sys.argv[8])

    date = dtfrom.split('T')[0]

    csv_file = path + date.split('-')[0] + '-' + date.split('-')[1] + '.csv'


    # alldata = ship_points_csv(dtfrom, csv_file, pos1, pos2, span, mmsis, dts_high, dts_low)
    # ship_routes(alldata)

    alldata = ship_points(dtfrom, pos1, pos2, span, mmsis, dts_high, dts_low)
    if len(alldata.index) > 0:
        ship_routes(alldata)


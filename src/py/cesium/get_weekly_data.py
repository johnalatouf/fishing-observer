import pandas as pd
import datetime
import string
import numpy as np
import solrEscapes

# reads the csv file, returns weekly data dictionary, mmsi string
# includes defaults for mmsi and dts filters
def get_weekly_data(dtfrom, csv_file, mmsis='all', dts_high=3000000.0, dts_low=0.0, ourlabel='all'):

    weekly_data = {}

    results = pd.read_csv(csv_file)
    results = results[results['fishing_f']>0]
    results.mmsi = results.mmsi.astype(str)

    # filter the dataframe by distance to shore and mmsis
    results = results[results['distshore_f'] >= dts_low]
    results = results[results['distshore_f'] <= dts_high]
    if mmsis != 'all':
        results = results[results['mmsi'].isin(string.split(mmsis, ','))]


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

    results = pd.read_csv('m_20130701_0_3000_1504285051.4036.csv')
    results = results[results['fishing_f'] > 0]

    mmsi_list = results.mmsi.unique()
    mmsi = ', '.join(str(x) for x in mmsi_list)
    # print len(mmsi)
    # print datetime.datetime.now()

    if ourlabel != 'all':
        ol = ourlabel.split(',')
        ol = map(int, ol)
        results = results[results['ourlabel'].isin(ol)]

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
        filtered = results[results['datetime'].apply(lambda s: s.startswith(dayt))]
        filtered = filtered[['mmsi', 'longitude', 'latitude', 'distshore_f', 'ourlabel']]
        weekly_data[day[0]] = filtered.as_matrix()
        start_day += 7
        end_day += 7
        count += 1
        if end_day > daycount + 1:
            end_day = daycount + 1
            # print dayt
            # print filtered

    filtered = results[['mmsi', 'longitude', 'latitude', 'distshore_f', 'ourlabel']]
    weekly_data['total_month'] = filtered.as_matrix()

    # print datetime.datetime.now()

    points = len(results)
    # print points

    # print datetime.datetime.now()

    return weekly_data, mmsi


# reads csv files in chunks when they are too large
# returns weekly data and mmsi list
def get_weekly_data_chunk(dtfrom, csv_file, mmsis='all', dts_high=3000000.0, dts_low=0.0, ourlabel='all'):
    chunksize = 2000000
    # TextFileReader = pd.read_csv(f, chunksize=chunksize)
    # df = pd.concat(TextFileReader, ignore_index=True)

    weekly_data = {}

    reader = pd.read_csv(csv_file, chunksize=chunksize)

    # for chunk in reader:
    #
    #     results = pd.concat(reader, ignore_index=True)

    results = pd.concat(reader, ignore_index=True)


    results = results[results['fishing_f']>0]
    results.mmsi = results.mmsi.astype(str)


    # filter the dataframe by distance to shore and mmsis
    results = results[results['distshore_f'] >= dts_low]
    results = results[results['distshore_f'] <= dts_high]


    if mmsis != 'all':
        results = results[results['mmsi'].isin(string.split(mmsis, ','))]


    print len(results)

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

    # results = pd.read_csv('m_20130701_0_3000_1504285051.4036.csv')
    # results = results[results['fishing_f'] > 0]

    mmsi_list = results.mmsi.unique()
    mmsi = ', '.join(str(x) for x in mmsi_list)

    if ourlabel != 'all':
        ol = ourlabel.split(',')
        ol = map(int, ol)
        results = results[results['ourlabel'].isin(ol)]
    # print len(mmsi)
    # print datetime.datetime.now()

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
        filtered = results[results['datetime'].apply(lambda s: s.startswith(dayt))]
        filtered = filtered[['mmsi', 'longitude', 'latitude', 'distshore_f', 'ourlabel']]
        weekly_data[day[0]] = filtered.as_matrix()
        start_day += 7
        end_day += 7
        count += 1
        if end_day > daycount + 1:
            end_day = daycount + 1
            # print dayt
            # print filtered

    filtered = results[['mmsi', 'longitude', 'latitude', 'distshore_f', 'ourlabel']]
    weekly_data['total_month'] = filtered.as_matrix()

    # print datetime.datetime.now()

    points = len(results)
    # print points

    # print datetime.datetime.now()

    return weekly_data, mmsi

# reads csv files in chunks when they are too large
# returns weekly data and mmsi list
def get_weekly_data_chunks(dtfrom, csv_file, mmsis='all', dts_high=3000000.0, dts_low=0.0, ourlabel='all'):
    chunksize = 2000000

    points = 0
    weekly_data = {}
    mmsi = ''
    mmsi_list =[]

    # escape and validate the date, return nothing if invalid
    dtfrom = solrEscapes.solr_escape_date(dtfrom)
    if dtfrom == '':
        return weekly_data, mmsi

    # escape the mmsis string
    mmsis = solrEscapes.solr_escape(mmsis)

    # read in the chunks and start filtering
    reader = pd.read_csv(csv_file, chunksize=chunksize)

    for results in reader:

        results = results[results['fishing_f']>0]

        results.mmsi = results.mmsi.astype(str)

        # filter the dataframe by distance to shore and mmsis
        results = results[results['distshore_f'] >= dts_low]
        results = results[results['distshore_f'] <= dts_high]
        if mmsis != 'all':
            results = results[results['mmsi'].isin(string.split(mmsis, ','))]


        points += len(results)

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

        mmsi_list.extend(results.mmsi.unique())
        # mmsi = ', '.join(str(x) for x in mmsi_list)

        if ourlabel != 'all':
            # print ourlabel
            ol = ourlabel.split(',')
            # print results['ourlabel']
            ol = map(int, ol)
            results = results[results['ourlabel'].isin(ol)]


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
            filtered = results[results['datetime'].apply(lambda s: s.startswith(dayt))]
            if ('mmsi' in filtered.columns):
                filtered = filtered[['mmsi', 'longitude', 'latitude', 'distshore_f', 'ourlabel']]

            if day[0] in weekly_data:
                # wd = weekly_data[day[0]]
                # np.append(wd, filtered.as_matrix())
                weekly_data[day[0]] = np.append(weekly_data[day[0]], filtered.as_matrix(), axis=0)
            else:
                weekly_data[day[0]] = filtered.as_matrix()

            start_day += 7
            end_day += 7
            count += 1
            if end_day > daycount + 1:
                end_day = daycount + 1
                # print dayt
                # print filtered

        if ('mmsi' in results.columns):
            filtered = results[['mmsi', 'longitude', 'latitude', 'distshore_f', 'ourlabel']]
        if 'total_month' in weekly_data:
            weekly_data['total_month'] = np.append(weekly_data['total_month'], filtered.as_matrix(), axis=0)
        else:
            weekly_data['total_month'] = filtered.as_matrix()


    # print datetime.datetime.now()
    mmsi_list = set(mmsi_list)
    mmsi_list = list(mmsi_list)
    mmsi = ', '.join(str(x) for x in mmsi_list)
    # print datetime.datetime.now()

    return weekly_data, mmsi

# reads csv files in chunks when they are too large
# returns weekly data and mmsi list
def get_weekly_only_data_chunks(dtfrom, csv_file, mmsis='all', dts_high=3000000.0, dts_low=0.0, ourlabel='all'):
    chunksize = 2000000

    points = 0
    weekly_data = {}
    mmsi = ''

    # escape and validate the date, return nothing if invalid
    dtfrom = solrEscapes.solr_escape_date(dtfrom)
    if dtfrom == '':
        return weekly_data, mmsi

    # escape the mmsis string
    mmsis = solrEscapes.solr_escape(mmsis)

    # read in the chunks and start filtering
    reader = pd.read_csv(csv_file, chunksize=chunksize)

    for results in reader:

        results = results[results['fishing_f']>0]

        results.mmsi = results.mmsi.astype(str)

        # filter the dataframe by distance to shore and mmsis
        results = results[results['distshore_f'] >= dts_low]
        results = results[results['distshore_f'] <= dts_high]
        if mmsis != 'all':
            results = results[results['mmsi'].isin(string.split(mmsis, ','))]


        points += len(results)

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

        # results = pd.read_csv('m_20130701_0_3000_1504285051.4036.csv')
        # results = results[results['fishing_f'] > 0]

        mmsi_list = results.mmsi.unique()
        mmsi = ', '.join(str(x) for x in mmsi_list)
        # print len(mmsi)
        # print datetime.datetime.now()

        if ourlabel != 'all':
            ol = ourlabel.split(',')
            ol = map(int, ol)
            results = results[results['ourlabel'].isin(ol)]

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
            filtered = results[results['datetime'].apply(lambda s: s.startswith(dayt))]
            filtered = filtered[['mmsi', 'longitude', 'latitude', 'distshore_f', 'ourlabel']]

            if day[0] in weekly_data:
                # wd = weekly_data[day[0]]
                # np.append(wd, filtered.as_matrix())
                weekly_data[day[0]] = np.append(weekly_data[day[0]], filtered.as_matrix(), axis=0)
            else:
                weekly_data[day[0]] = filtered.as_matrix()

            start_day += 7
            end_day += 7
            count += 1
            if end_day > daycount + 1:
                end_day = daycount + 1
                # print dayt
                # print filtered

    return weekly_data, mmsi


# reads csv files in chunks when they are too large
# returns one week of data and mmsi list
def get_week_data_chunks(dtfrom, csv_file, mmsis='all', dts_high=3000000.0, dts_low=0.0, ourlabel='all'):
    chunksize = 2000000

    points = 0
    weekly_data = {}
    mmsi = ''

    # escape and validate the date, return nothing if invalid
    dtfrom = solrEscapes.solr_escape_date(dtfrom)
    if dtfrom == '':
        return weekly_data, mmsi

    # escape the mmsis string
    mmsis = solrEscapes.solr_escape(mmsis)

    # read in the chunks and start filtering
    reader = pd.read_csv(csv_file, chunksize=chunksize)

    for results in reader:

        results = results[results['fishing_f']>0]

        results.mmsi = results.mmsi.astype(str)

        # filter the dataframe by distance to shore and mmsis
        results = results[results['distshore_f'] >= dts_low]
        results = results[results['distshore_f'] <= dts_high]
        if mmsis != 'all':
            results = results[results['mmsi'].isin(string.split(mmsis, ','))]


        points += len(results)

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

        # results = pd.read_csv('m_20130701_0_3000_1504285051.4036.csv')
        # results = results[results['fishing_f'] > 0]

        mmsi_list = results.mmsi.unique()
        mmsi = ', '.join(str(x) for x in mmsi_list)
        # print len(mmsi)
        # print datetime.datetime.now()

        if ourlabel != 'all':
            ol = ourlabel.split(',')
            ol = map(int, ol)
            results = results[results['ourlabel'].isin(ol)]

        # split up by week
        count = 0
        start_day = (int)(dtfrom.split('T')[0].split('-')[2])
        end_day = start_day + 7

        day = []
        for d in range(start_day, end_day):
            if d > 10:
                day.append('%s-%s-%s' % (year, month, d))
            else:
                day.append('%s-%s-0%s' % (year, month, d))

        dayt = tuple(day)
        filtered = results[results['datetime'].apply(lambda s: s.startswith(dayt))]
        filtered = filtered[['mmsi', 'longitude', 'latitude', 'distshore_f', 'ourlabel']]

        if day[0] in weekly_data:
            weekly_data[day[0]] = np.append(weekly_data[day[0]], filtered.as_matrix(), axis=0)
        else:
            weekly_data[day[0]] = filtered.as_matrix()


        # filtered = results[['mmsi', 'longitude', 'latitude', 'distshore_f', 'ourlabel']]
        # if 'total_month' in weekly_data:
        #     weekly_data['total_month'] = np.append(weekly_data['total_month'], filtered.as_matrix(), axis=0)
        # else:
        #     weekly_data['total_month'] = filtered.as_matrix()

    return weekly_data, mmsi

# reads csv files in chunks when they are too large
# returns one month data and mmsi list
def get_month_data_chunks(dtfrom, csv_file, mmsis='all', dts_high=3000000.0, dts_low=0.0, ourlabel='all'):
    chunksize = 2000000

    points = 0
    weekly_data = {}
    mmsi = ''

    # escape and validate the date, return nothing if invalid
    dtfrom = solrEscapes.solr_escape_date(dtfrom)
    if dtfrom == '':
        return weekly_data, mmsi

    # escape the mmsis string
    mmsis = solrEscapes.solr_escape(mmsis)

    # read in the chunks and start filtering
    reader = pd.read_csv(csv_file, chunksize=chunksize)

    for results in reader:

        results = results[results['fishing_f']>0]
        results.mmsi = results.mmsi.astype(str)

        # filter the dataframe by distance to shore and mmsis
        results = results[results['distshore_f'] >= dts_low]
        results = results[results['distshore_f'] <= dts_high]
        if mmsis != 'all':
            results = results[results['mmsi'].isin(string.split(mmsis, ','))]



        points += len(results)

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

        # results = pd.read_csv('m_20130701_0_3000_1504285051.4036.csv')
        # results = results[results['fishing_f'] > 0]

        mmsi_list = results.mmsi.unique()
        mmsi = ', '.join(str(x) for x in mmsi_list)
        # print len(mmsi)
        # print datetime.datetime.now()

        if ourlabel != 'all':
            ol = ourlabel.split(',')
            ol = map(int, ol)
            results = results[results['ourlabel'].isin(ol)]


        filtered = results[['mmsi', 'longitude', 'latitude', 'distshore_f', 'ourlabel']]
        if 'total_month' in weekly_data:
            weekly_data['total_month'] = np.append(weekly_data['total_month'], filtered.as_matrix(), axis=0)
        else:
            weekly_data['total_month'] = filtered.as_matrix()

    return weekly_data, mmsi

# faster chunk read
def get_month_data_chunk(dtfrom, csv_file, mmsis='all', dts_high=3000000.0, dts_low=0.0, ourlabel='all'):
    chunksize = 2000000

    points = 0
    weekly_data = {}
    mmsi = ''

    # escape and validate the date, return nothing if invalid
    dtfrom = solrEscapes.solr_escape_date(dtfrom)
    if dtfrom == '':
        return weekly_data, mmsi

    # escape the mmsis string
    mmsis = solrEscapes.solr_escape(mmsis)

    # read in the chunks and start filtering
    TextFileReader = pd.read_csv(csv_file, chunksize=chunksize)
    results = pd.concat(TextFileReader, ignore_index=True)

    results = results[results['fishing_f'] > 0]
    results.mmsi = results.mmsi.astype(str)

    # filter the dataframe by distance to shore and mmsis
    results = results[results['distshore_f'] >= dts_low]
    results = results[results['distshore_f'] <= dts_high]
    if mmsis != 'all':
        results = results[results['mmsi'].isin(string.split(mmsis, ','))]

    points += len(results)

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

    # results = pd.read_csv('m_20130701_0_3000_1504285051.4036.csv')
    # results = results[results['fishing_f'] > 0]

    mmsi_list = results.mmsi.unique()
    mmsi = ', '.join(str(x) for x in mmsi_list)
    # print len(mmsi)
    # print datetime.datetime.now()

    if ourlabel != 'all':
        ol = ourlabel.split(',')
        ol = map(int, ol)
        results = results[results['ourlabel'].isin(ol)]

    filtered = results[['mmsi', 'longitude', 'latitude', 'distshore_f', 'ourlabel']]
    if 'total_month' in weekly_data:
        weekly_data['total_month'] = np.append(weekly_data['total_month'], filtered.as_matrix(), axis=0)
    else:
        weekly_data['total_month'] = filtered.as_matrix()

    return weekly_data, mmsi
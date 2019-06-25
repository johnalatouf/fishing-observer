import pandas as pd
import datetime
import string
import numpy as np
import solrEscapes
import get_weekly_data
import datashader as ds
import datashader.transfer_functions as tf
from datashader.utils import  summarize_aggregate_values
import json
import gradients
import sys
import os.path
from datetime import datetime

# heatmap: the nd array to build from
# split_val: int to split by
def ds_to_img(heatmap, split_val, color_key=None):
    # for value in heatmap:
    # ['mmsi', 'longitude', 'latitude', 'distshore_f', 'ourlabel']

    if color_key is None:
        color_key = {'1': gradients.gradient_orange[63], '0': gradients.gradient_green[63]}

    df = pd.DataFrame(heatmap, columns=["mmsi", "X", "Y", "distshore_f", "ourlabel"])
    df.ourlabel = df.ourlabel.astype(int)
    df.ourlabel = df.ourlabel.astype(str)
    df.X = df.X.astype(float)
    df.Y = df.Y.astype(float)
    df.distshore_f = df.distshore_f.astype(float)

    if len(df) < 1:
        df.loc[len(df)] = ['-', -180, -90, 0.0, '0']

    # cvs = ds.Canvas(plot_width=int(360 * split_val), plot_height=int(180 * split_val), x_range=(-180, 180),
    #                 y_range=(-90, 90))
    #
    # # now make the image
    # agg = cvs.points(df, 'X', 'Y')

    cvs = ds.Canvas(plot_width=int(360 * split_val), plot_height=int(180 * split_val), x_range=(-180, 180),
                    y_range=(-90, 90))
    df.ourlabel = df.ourlabel.astype('category')

    # now make the image
    agg = cvs.points(df, 'X', 'Y', ds.count_cat('ourlabel'))
    # color_key = {'2': gradients.gradient_violet[63], 'other': gradients.gradient_red[0],
    #              '1': gradients.gradient_orange[63], '0': gradients.gradient_green[63],
    #              '-': gradients.gradient_red[0]}

    # images = tf.shade(agg, cmap=['gold', 'darkmagenta'], how='log', min_alpha=0)

    images = tf.shade(agg, color_key=color_key, how='log', min_alpha=0)

    img = images.data.tolist()

    image = []

    # change alpha=0 to 0, no need to send these values
    x_c = 0
    for x in img:
        # i = []
        y_c = 0
        for y in x:
            if y != 0:
                alpha = (y >> 24) & 255
                # blue = (y >> 16) & 255
                # green = (y >> 8) & 255
                # red = y & 255
                if alpha > 0:
                    # i.append(y)
                    image.append([x_c, y_c, y])
                # else:
                    # i.append(0)
                    # image.append(i)
            y_c += 1
        x_c += 1


    try:
        vals_arr, min_val, max_val = summarize_aggregate_values(agg, how='log')
        # print '%s %s %s' % (vals_arr, min_val, max_val)
    except ValueError:
        min_val = 0
        max_val = 0

    # return json.dumps(img)
    return image, min_val, max_val

def print_whole_month(dtfrom, path, mmsis, dts_high, dts_low, split_val, ourlabel='all', color_key=None):
    date = dtfrom.split('T')[0]

    csv_file = path + date.split('-')[0] + '-' + date.split('-')[1] + '.csv'

    # images = []
    # min_vals = []
    # max_vals = []

    images = {}

    # check if csv exists
    if os.path.isfile(csv_file):

        # gets the data from the csv
        weekly_data, mmsis = get_weekly_data.get_weekly_data_chunks(dtfrom, csv_file, mmsis, dts_high, dts_low, ourlabel)

        # builds the heatmaps
        for key, hm in weekly_data.iteritems():
            img, min_val, max_val = ds_to_img(hm, split_val, color_key)
            # images.append(img)
            # min_vals.append(min_val)
            # max_vals.append(max_val)
            images[key] = [img, [int(min_val)], [int(max_val)]]

        images['mmsi'] = mmsis
        print json.dumps(images)
        # print images['total_month'][1]
    else:
        print 'File %s does not exist' % (csv_file)

def print_weekly(dtfrom, path, mmsis, dts_high, dts_low, split_val, ourlabel='all', color_key=None):
    date = dtfrom.split('T')[0]

    csv_file = path + date.split('-')[0] + '-' + date.split('-')[1] + '.csv'

    # images = []
    # min_vals = []
    # max_vals = []

    images = {}

    # check if csv exists
    if os.path.isfile(csv_file):

        # gets the data from the csv
        weekly_data, mmsis = get_weekly_data.get_week_data_chunks(dtfrom, csv_file, mmsis, dts_high, dts_low, ourlabel)

        # builds the heatmaps
        for key, hm in weekly_data.iteritems():
            img, min_val, max_val = ds_to_img(hm, split_val, color_key)
            # images.append(img)
            # min_vals.append(min_val)
            # max_vals.append(max_val)
            images[key] = [img, [int(min_val)], [int(max_val)]]
        images['mmsi'] = mmsis

        print json.dumps(images)

# print all the weeks but no month
def print_all_weeks(dtfrom, path, mmsis, dts_high, dts_low, split_val, ourlabel='all', color_key=None):
    date = dtfrom.split('T')[0]

    csv_file = path + date.split('-')[0] + '-' + date.split('-')[1] + '.csv'

    # images = []
    # min_vals = []
    # max_vals = []

    images = {}

    # check if csv exists
    if os.path.isfile(csv_file):

        # gets the data from the csv
        weekly_data, mmsis = get_weekly_data.get_weekly_only_data_chunks(dtfrom, csv_file, mmsis, dts_high, dts_low, ourlabel)

        # builds the heatmaps
        for key, hm in weekly_data.iteritems():
            img, min_val, max_val = ds_to_img(hm, split_val, color_key)
            # images.append(img)
            # min_vals.append(min_val)
            # max_vals.append(max_val)
            images[key] = [img, [int(min_val)], [int(max_val)]]
        images['mmsi'] = mmsis

        print json.dumps(images)

def print_month(dtfrom, path, mmsis, dts_high, dts_low, split_val, ourlabel='all', color_key=None):
    date = dtfrom.split('T')[0]

    csv_file = path + date.split('-')[0] + '-' + date.split('-')[1] + '.csv'

    # images = []
    # min_vals = []
    # max_vals = []

    images = {}

    # check if csv exists
    if os.path.isfile(csv_file):
        # gets the data from the csv
        # weekly_data, mmsis = get_weekly_data.get_month_data_chunks(dtfrom, csv_file, mmsis, dts_high, dts_low, ourlabel)
        weekly_data, mmsis = get_weekly_data.get_month_data_chunk(dtfrom, csv_file, mmsis, dts_high, dts_low, ourlabel)

        # builds the heatmaps
        # for key, hm in weekly_data.iteritems():
        #     img, min_val, max_val = ds_to_img(hm, split_val)
        #     images[key] = [img, [int(min_val)], [int(max_val)]]

        img, min_val, max_val = ds_to_img(weekly_data['total_month'], split_val, color_key)
        images['total_month'] = [img, [int(min_val)], [int(max_val)]]

        images['mmsi'] = mmsis

        print json.dumps(images)

# run program
# build_ds.py dtfrom path mmsis dts_high dts_low split_val span
# prints heatmap and mmsi's to json
if __name__ == "__main__":
    try:
        dtfrom = solrEscapes.solr_escape_date(sys.argv[1])          # the start date
        path = sys.argv[2]                                          # the path to csv's
        mmsis = sys.argv[3]                                         # mmsi's to search, 'all' if all
        dts_high = float(sys.argv[4])                               # distance to shore high
        dts_low = float(sys.argv[5])                                # distance to shore low
        split_val = int(sys.argv[6])                                # pixel split amount
        span = sys.argv[7]                                          # 'month' or 'week' = one at a time
        ourlabel = sys.argv[8]                                      # labels to build

        if len(sys.argv) > 8:
            color_key = {}
            colors = sys.argv[9].split(',')
            for c in colors:
                c_key = c.split(':')[0]
                c_val = c.split(':')[1]
                color_key[c_key] = c_val

            if span == 'month':
                print_month(dtfrom, path, mmsis, dts_high, dts_low, split_val, ourlabel, color_key)
            elif span == 'week':
                print_weekly(dtfrom, path, mmsis, dts_high, dts_low, split_val, ourlabel, color_key)
            elif span == 'all_weeks':
                print_all_weeks(dtfrom, path, mmsis, dts_high, dts_low, split_val, ourlabel, color_key)
            else:
                print_whole_month(dtfrom, path, mmsis, dts_high, dts_low, split_val, ourlabel, color_key)
        else:
            if span == 'month':
                print_month(dtfrom, path, mmsis, dts_high, dts_low, split_val, ourlabel)
            elif span == 'week':
                print_weekly(dtfrom, path, mmsis, dts_high, dts_low, split_val, ourlabel)
            elif span == 'all_weeks':
                print_all_weeks(dtfrom, path, mmsis, dts_high, dts_low, split_val, ourlabel)
            else:
                print_whole_month(dtfrom, path, mmsis, dts_high, dts_low, split_val, ourlabel)


    except Exception as e:
        pathname = os.path.dirname(sys.argv[0]) + str(sys.argv[0])
        called = ''
        for s in sys.argv:
            called += '%s ' % (s)
        logf = open("/data/logspythonwww/log.log", "a")
        logf.write('\n%s: file: %s \n%s \n%s\n' % (str(datetime.now()), os.path.abspath(pathname), called, str(e)))
        logf.close()
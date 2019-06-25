import pandas as pd
import solrEscapes
import json
import pysolr
import sys


def itu_solr(mmsis):
    solr_itu = pysolr.Solr('localhost:8983/solr/itu', timeout=3000)
    # search for the names of each ship
    data = pd.DataFrame()

    # search_names = 'mmsi:(%s)' % (mmsis)
    search_names = '%s' % (mmsis)
    results = solr_itu.search(search_names,
                                   **{'rows': 50000})

    if len(results) > 0:
        # df = pd.DataFrame(results.docs)
        # print df
        data = pd.DataFrame(results.docs)


        data = data[['mmsi', 'ourlabel', 'name', 'country', 'indcls']]

        # data.mmsi = data.mmsi.map(lambda x: x[0].encode("utf-8"))
        # data.ourlabel = data.ourlabel.map(lambda x: x[0].encode("utf-8"))
        # data.name = data.name.map(lambda x: x[0].encode("utf-8"))
        # data.country = data.country.map(lambda x: x[0].encode("utf-8"))
        # data.indcls = data.indcls.map(lambda x: x[0].encode("utf-8"))

        data.mmsi = data.mmsi.astype(str).map(lambda x: x.lstrip('[u\'').rstrip('\']').encode("utf-8"))
        data.ourlabel = data.ourlabel.astype(str).map(lambda x: x.lstrip('[u\'').rstrip('\']').encode("utf-8"))
        # data.name = data.name.astype(str).map(lambda x: x.lstrip('[u\'').rstrip('\']'))
        data.country = data.country.astype(str).map(lambda x: x.lstrip('[u\'').rstrip('\']').encode("utf-8"))
        data.indcls = data.indcls.astype(str).map(lambda x: x.lstrip('[u\'').rstrip('\']').encode("utf-8"))



        # data.mmsi = data.mmsi.apply(' '.join)
        # data.ourlabel = data.ourlabel.apply(' '.join)
        data.name = data.name.apply(' '.join)
        # data.country = data.country.apply(' '.join)
        # data.indcls = data.indcls.apply(' '.join)

    return data

# turn it into a dict of dicts by mmsi
def itu_to_dict(df):
    # print (df.columns.tolist())
    m = u'mmsi'
    if m in df.columns:
        df = df.set_index(m)
        df = df.to_dict(orient="index")
        return df
    elif m.encode('utf-8') in df.columns:
        df = df.set_index(m.encode('utf-8'))
        df = df.to_dict(orient="index")
        return df

if __name__ == "__main__":
    mmsis = solrEscapes.solr_escape(sys.argv[1]).replace(",", " ")                 # mmsi's to search

    all_data = itu_solr(mmsis)
    if not all_data.empty:
        dict = itu_to_dict(all_data)

        print json.dumps(dict)


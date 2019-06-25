# clean up solr input

import re
# escape solr strings
def solr_escape(value):
    ESCAPE_CHARS_RE = re.compile(r'(?<!\\)(?P<char>[&|+\-!\/(){}[\]^"~*?:])')
    return ESCAPE_CHARS_RE.sub(r'\\\g<char>', value)

# escape solr positions
def solr_escape_latlon(value):
    ESCAPE_CHARS_RE = re.compile(r'(?<!\\)(?P<char>[&|+\!\/(){}[\]^"~*?:])')
    # \-*\d+(\.\d+)*,\-*\d+(\.\d+)*$
    matches = re.match(r'\-*\d+(\.\d+)*,\-*\d+(\.\d+)*$', value)

    if matches:
        return ESCAPE_CHARS_RE.sub(r'\\\g<char>', value)
    else:
        return ''

# escape solr dates
def solr_escape_date(value):
    ESCAPE_CHARS_RE = re.compile(r'(?<!\\)(?P<char>[&|+\!(){}[\]^"~*?])')
    output = ESCAPE_CHARS_RE.sub(r'\\\g<char>', value)
    matches = re.match(r'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$', output)
    if matches:
        return output
    else:
        return ''
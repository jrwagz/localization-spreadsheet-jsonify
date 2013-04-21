"""
Copyright (c) 2013 Justin Wagner, Max Vilimpoc

Permission is hereby granted, free of charge, to any person obtaining 
a copy of this software and associated documentation files (the "Software"), 
to deal in the Software without restriction, including without limitation 
the rights to use, copy, modify, merge, publish, distribute, sublicense, 
and/or sell copies of the Software, and to permit persons to whom 
the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be 
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS 
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL 
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR 
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, 
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE 
OR OTHER DEALINGS IN THE SOFTWARE.
"""

"""
Generates iOS translation files from Localization Spreadsheet 
JSONify output.

Just specify the SOURCE_URL variable below and call this script
to do the generation. 

You will then have a bunch of <language_code>.lproj/ folders in the same directory
as your script for each language. And each folder will contain the localized files
specified in the JSON downloaded from the site.

    Loading translation spreadsheet data.
    Generating translations.
    Creating fr.lproj/InfoPlist.strings
    Creating de.lproj/InfoPlist.strings
    Creating en.lproj/InfoPlist.strings
    Creating es.lproj/InfoPlist.strings
    Creating fr.lproj/Localizable.strings
    Creating de.lproj/Localizable.strings
    Creating en.lproj/Localizable.strings
    Creating es.lproj/Localizable.strings
"""

import codecs
import json
import os
import pwd
import requests
from datetime import date
import textwrap

FOLDERNAME = '{code}.lproj/'

SOURCE_URL = 'https://script.google.com/macros/s/AKfycbx2NkSCqHfoiyufF72fBaPDNFq8lOyEncLjxVujKpWyMzIRBZbN/exec?spreadsheet%5fid=0AuWQ-iCrlReTdE9YeVJhdFk0NW4zZlpRZTYtQzN3a2c&sheet%5fname=Main'

PROJECT_NAME = 'LDSMusic'

COMPANY_NAME = 'Intellectual Reserve, Inc.'

if __name__ == '__main__':
    print 'Loading translation spreadsheet data.'
    r = requests.get(SOURCE_URL)
    
    if r.ok:
        print 'Generating translations.'

        data = r.json()
        
        for filename, file_dict in sorted(data.iteritems()):

            metadata_dict = file_dict['metadata']
            language_codes_dict = file_dict['language_codes']
            
            for language_code in sorted(language_codes_dict.keys()):
                # Create locale directories.
                folder_path = FOLDERNAME.format(code=language_code)
                if not os.path.isdir(folder_path):
                    os.makedirs(folder_path)
                    print u'Creating {0}'.format(folder_path)
            
                language_dict = language_codes_dict[language_code]
                output = []
            
                # Create Header
                username = pwd.getpwuid(os.getuid()).pw_name
                today = date.today()
                if filename == 'Localizable.strings':
                    file_header = textwrap.dedent("""\
                        /*
                          {filename}
                          {project}
                        
                          Created by {username} on {create_date}.
                          Copyright (c) {copyright_year} {company_name} All rights reserved.
                        */""").format(filename=filename,username=username,create_date=today.strftime('%d/%b/%Y'),copyright_year=today.strftime('%Y'),project=PROJECT_NAME,company_name=COMPANY_NAME)
                elif filename == 'InfoPlist.strings':
                    file_header = '/* Localized versions of Info.plist keys */'
                else:
                    file_header = ''
                            
                # Print the Header
                output.append((u'{header}\n'.format(header=file_header)))
                # Print all the Keys
                for string_key in sorted(language_dict.keys()):
                    output.append((u'\n/* {0} */\n'.format(metadata_dict[string_key]['description'])))
                    output.append((u'"{key}" = "{value}";\n'.format(key=string_key,value=language_dict[string_key])))
                
                full_filename = folder_path + filename
                print u'Creating {0}'.format(full_filename)
                
                # Flush the file to disk
                with codecs.open(full_filename, "wb", encoding='utf-8') as locFile:
                    locFile.write(u''.join(output))
                    locFile.close()
    else:
        print r"Couldn't load spreadsheet data from Google Docs."

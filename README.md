localization-spreadsheet-jsonify
================================

A Google App Script that lets you easily access a localization/translation 
Google spreadsheet in JSON format. In other words, you can put together a 
string translation table in Google Docs, and this script will export it
to JSON for you with a minimum of effort.

Step 1
------

Make spreadsheet like this one:

<a href="https://docs.google.com/spreadsheet/ccc?key=0AuWQ-iCrlReTdE9YeVJhdFk0NW4zZlpRZTYtQzN3a2c">https://docs.google.com/spreadsheet/ccc?key=0AuWQ-iCrlReTdE9YeVJhdFk0NW4zZlpRZTYtQzN3a2c</a>

Step 2
------

**Export it to JSON**:

<a href="https://script.google.com/macros/s/AKfycbx2NkSCqHfoiyufF72fBaPDNFq8lOyEncLjxVujKpWyMzIRBZbN/exec?spreadsheet%5fid=0AuWQ-iCrlReTdE9YeVJhdFk0NW4zZlpRZTYtQzN3a2c&sheet%5fname=Main">https://script.google.com/macros/s/AKfycbx2NkSCqHfoiyufF72fBaPDNFq8lOyEncLjxVujKpWyMzIRBZbN/exec?spreadsheet%5fid=0AuWQ-iCrlReTdE9YeVJhdFk0NW4zZlpRZTYtQzN3a2c&sheet%5fname=Main</a>

**Export it to iOS Localization files**:

1. Edit the variables in ios.localize/updateStrings.py as appropriate for your spreadsheet
2. From ios.localize run "python updateStrings.py"
3. You should see the appropriate localization project folders (en.lproj/, es.lproj/, etc) be created in the same directory you called the script from.
4. Done.

More Info
---------

To see more info about invoking the app, go to:

<a="https://script.google.com/macros/s/AKfycbx2NkSCqHfoiyufF72fBaPDNFq8lOyEncLjxVujKpWyMzIRBZbN/exec">https://script.google.com/macros/s/AKfycbx2NkSCqHfoiyufF72fBaPDNFq8lOyEncLjxVujKpWyMzIRBZbN/exec</a>

/*
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
 */

/*
 To use this:
 
 Simply call the public access API with the following parameters
 set:
 
 spreadsheet_id   required   ex: 0AqrUvD5TZZs3dF9ULUh5X1JlakVJRGFHaWRZQmFuZEE
 sheet_name       required   ex: Main
 threshold        optional
 
 Make sure the spreadsheet you want to access is public or that
 you are logged in and have access to it.
 
 
 Customizing:
 
 File->Make a copy
 Replace the SPREADSHEET_ID and SHEET_NAME with those you want to publish.
 Publish->Deploy as web app
 Now, open up the "Current web app URL", et voila, you have a
 usable JSON dictionary of strings in a language.
 */

// Yeah, it's global variables, but this app isn't going to do too much.

// Defaults: Use Localization example spreadsheet if parameters
//           aren't provided in the HTTP request
var SHEET_ID   = "0AuWQ-iCrlReTdE9YeVJhdFk0NW4zZlpRZTYtQzN3a2c";
var SHEET_NAME = "Sheet1";

// Allow for specification of which file the key resides in
var FILENAME_COLUMN = 0;

// Specify which column contains the language key
var KEYS_COLUMN = 1;

// Addition: Metadata information for each translation key
var NUM_METADATA_KEYS = 2;

// Convention: Put the default translation value in the first column
// to the right of the KEYS_COLUMN and the METADATA columns
//
// In other words, when a translation doesn't exist for the language
// column you are in, use the English translation for the time being.
var DEFAULT_VALUES_COLUMN = KEYS_COLUMN + NUM_METADATA_KEYS + 1;

// The column containing the first language code, since we can have
// a variable number of METADATA keys associated with each KEY
var FIRST_LANGUAGE_COLUMN = DEFAULT_VALUES_COLUMN;

// Convention: Put the language codes in the first row of the table.
//
// A recommended practice is to go from base-language codes to country-specific
// language codes, e.g. "de" then "de-AT" from left to right in the
// spreadsheet. The translation-string selection loop below relies on
// base translations to have been processed before the country-specific
// cases.
var LANGUAGE_CODE_ROW = 0;

// Convention: What percentage of keys need a native translation (filled
// cell), before they are considered deployment ready?
//
// Let's say in this case 75% of fields need to be natively translated.
var DEPLOYMENT_READY_THRESHOLD = 0.5;

var FORMAT = {
JSON: 0,
GETTEXT: 1
};

function processRequestParams(request) {
    if (request.parameters.spreadsheet_id) SHEET_ID   = request.parameters.spreadsheet_id;
    if (request.parameters.sheet_name) SHEET_NAME = request.parameters.sheet_name;
    if (request.parameters.threshold)  DEPLOYMENT_READY_THRESHOLD = Number(request.parameters.threshold);
}

function generateJson(request) {
    // No UI, just straightforward translation to JSON.
    var ss    = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    
    //
    var range = sheet.getDataRange();
    
    // Total number of active rows + columnsin the spreadsheet.
    var rowCount = range.getNumRows();
    var colCount = range.getNumColumns();
    
    // Looks like data[row][column].
    var data = sheet.getDataRange().getValues();
    
    // Output Localization dictionary
    var outputTable = {};
    
    // Loop through each row of a language column and pair it with one of the keys in
    // the KEYS_COLUMN.
    
    for (var r = 1; r < rowCount; ++r) {
        var file_name = data[r][FILENAME_COLUMN];
        var key = data[r][KEYS_COLUMN];
        
        var file_dict = outputTable[file_name] || {};
        var metadata_dict = file_dict["metadata"] || {};
        var key_dict = metadata_dict[key] || {};
        
        for (var c = 1; c <= NUM_METADATA_KEYS; ++c) {
            var meta_title = data[0][KEYS_COLUMN+c].toLowerCase();
            var meta_value = data[r][KEYS_COLUMN+c];
            
            // If there's no key in this row, then skip.
            if (!meta_title || !meta_value) continue;
            
            key_dict[meta_title] = meta_value;
        }
        metadata_dict[key] = key_dict;
        file_dict["metadata"] = metadata_dict;
        outputTable[file_name] = file_dict;
    }
    
    // Loop through each row of a language column and pair it with one of the keys in
    // the KEYS_COLUMN.
    for (var c = FIRST_LANGUAGE_COLUMN; c < colCount; ++c) {
        var dict = {};
        var nativeTerms = 0;
        
        var full_language_code = data[LANGUAGE_CODE_ROW][c];
        var full_language_code_split = full_language_code.split("_");
        var base_language_code = full_language_code_split[0];
        
        for (var r = 1; r < rowCount; ++r) {
            var file_name = data[r][FILENAME_COLUMN];
            var key   = data[r][KEYS_COLUMN];
            
            // If there's no key in this row, then skip.
            if (!key || !file_name) continue;
            
            var file_dict = outputTable[file_name] || {};
            var languages_dict = file_dict["language_codes"] || {};
            var lang_dict = languages_dict[full_language_code] || {};
            
            var base_table = languages_dict[base_language_code] || {};
            
            // The value is set in this order:
            //
            // 1. Use the specific translation.
            // 2. Use the nearest translation from the same 2-letter locale.
            //    So for instance, if a specific translation for "de_AT" isn't
            //    available, it falls back to the "de" translation.
            // 3. If all else fails, just take the value from the DEFAULT_VALUES_COLUMN,
            //    which is the language that defines all terms needing translation.
            
            var value = data[r][c] || base_table[key] || data[r][DEFAULT_VALUES_COLUMN];
            
            // Keep count of each time we used the specific translation.
            if (value == data[r][c])
                nativeTerms++;
            
            lang_dict[key] = value;
            languages_dict[full_language_code] = lang_dict;
            file_dict["language_codes"] = languages_dict;
            outputTable[file_name] = file_dict;
            // outputTable[file_name]["language_codes"][full_language_code][key] = value;
        }
        
        // Only store this mapping to the output table if it meets the
        // DEPLOYMENT_READY_THRESHOLD;
        if ((nativeTerms / (rowCount - 1)) < DEPLOYMENT_READY_THRESHOLD) {
            // TODO: delete the appropriate information if the deployment threshold has not been met
            for (var key in outputTable) {
                delete outputTable[key]["language_codes"][full_language_code];
            }
        }
    }
    
    var outputJson = Utilities.jsonStringify(outputTable);
    
    // If there was a JSONP callback parameter, use it.
    if (request.parameters.callback) outputJson = request.parameters.callback + '(' + outputJson + ')';
    
    return ContentService.createTextOutput(outputJson).setMimeType(ContentService.MimeType.JSON);
}

function generateGettext() {
}

function generateUi(request) {
}

function doGet(request) {
    if (!request ||
        !request.parameters ||
        !request.parameters.spreadsheet_id ||
        !request.parameters.sheet_name) {
        return HtmlService.createTemplateFromFile('Help').evaluate();
    }
    
    if (!request.parameters.format) {
    }
    
    if (request.parameters.showUi) {
        return generateUi(request);
    }
    
    processRequestParams(request);
    return generateJson(request);
}
#target illustrator

#include "/Users/scott/github/iconify/jsx-common/JSON.jsxinc";
#include "/Users/scott/github/iconify/jsx-common/Utils.jsxinc";
#include "/Users/scott/github/iconify/jsx-common/Logger.jsx";

/**
 * USAGE:
 *
 * 1. Place this script in Applications > Adobe Illustrator > Presets > en_US > Scripts
 * 2. Restart Adobe Illustrator to activate the script
 * 3. The script will be available under menu File > Scripts > BatchResizeArtboards
 * 4. ...
 */
/**
 * LICENSE & COPYRIGHT
 *
 *   You are free to use, modify, and distribute this script as you see fit.
 *   No credit is required but would be greatly appreciated.
 *
 *   Scott Lewis - scott@iconify.it
 *   http://github.com/iconifyit
 *   http://iconify.it
 *
 *   THIS SCRIPT IS OFFERED AS-IS WITHOUT ANY WARRANTY OR GUARANTEES OF ANY KIND.
 *   YOU USE THIS SCRIPT COMPLETELY AT YOUR OWN RISK AND UNDER NO CIRCUMSTANCES WILL
 *   THE DEVELOPER AND/OR DISTRIBUTOR OF THIS SCRIPT BE HELD LIABLE FOR DAMAGES OF
 *   ANY KIND INCLUDING LOSS OF DATA OR DAMAGE TO HARDWARE OR SOFTWARE. IF YOU DO
 *   NOT AGREE TO THESE TERMS, DO NOT USE THIS SCRIPT.
 */

Utils.displayAlertsOff();

/**
 * Constants
 */
const DATE_STRING      = Utils.dateFormat((new Date()).getTime());
const SESSION_FILENAME = "ai-" + DATE_STRING + "-r1.json";

/**
 * @type {{
 *    SRCFOLDER: string,
 *    LOGFOLDER: string,
 *    LOGFILE: string,
 *    NO_OPEN_DOCS: *,
 *    NO_DOC_SELECTED: *,
 *    SESSION_SAVED: *,
 *    ENTER_FILENAME: *,
 *    JSON_EXT: string,
 *    TEXT_EXT: string
 * }}
 */
var CONFIG = {
    SRCFOLDER        : "/Users/scott/Dropbox/Dropbox (Personal)/ai-sessions",
    LOGFOLDER        : "/Users/scott/Dropbox/Dropbox (Personal)/ai-sessions/logs",
    LOGFILE          : "/Users/scott/Dropbox/Dropbox (Personal)/ai-sessions/logs/ai-log-"  + DATE_STRING  + "-r1.log",
    NO_OPEN_DOCS     : localize({en_US: "There are no open docs to save for this session"}),
    NO_DOC_SELECTED  : localize({en_US: "You have not selected a session to open"}),
    SESSION_SAVED    : localize({en_US: "Your Session Was Saved!"}),
    ENTER_FILENAME   : localize({en_US: "Enter a session file name or click enter to use the default name"}),
    JSON_EXT         : ".json",
    TEXT_EXT         : ".txt"
};

/**
 * Run the script using the Module patter.
 */
var AiSessions = (function(CONFIG) {

    /**
     * The local scope logger object.
     * @type {Logger}
     */
    var logger = new Logger($.fileName, CONFIG.LOGFOLDER);

    /**
     * The Dialog for this module.
     * @returns {*}
     * @constructor
     */
    var Dialog = function() {
        // Show dialog in center of screen

        var dialog = Utils.window(
            "dialog",
            Utils.i18n("Ai Sessions"),
            350, 350
        );

        // Message area

        dialog.msgBox = dialog.add("statictext", [30,30,300,60], "");

        // Cancel button

        dialog.closeBtn = dialog.add("button", [30,275,120,315], "Close", {name:"close"});
        dialog.closeBtn.onClick = function() { dialog.close(); };

        dialog.openBtn = dialog.add("button", [130,275,220,315], "Open", {name:"open"});
        dialog.openBtn.enabled = false;

        dialog.openBtn.onClick = function() {
            openButtonCallback(dialog.sessions.selection.text);
        };

        dialog.saveBtn = dialog.add("button", [230,275,320,315], "Save", {name:"save"});
        dialog.saveBtn.onClick = saveButtonCallback;

        var sessions = new Folder(CONFIG.SRCFOLDER).getFiles("*.json");

        if (! sessions.length) {
            dialog.msgBox.text = Utils.i18n("You have no saved sessions");
        }
        else {

            if (dialog.sessions) {
                dialog.sessions.removeAll();
            }

            /**
             * Let's show the newest sessions at the top.
             */
            sessions.sort(comparator);
            sessions.reverse();

            dialog.sessions = dialog.add("listbox", [30, 70, 320, 230]);
            for (i=0; i < sessions.length; i++) {
                item = dialog.sessions.add("item", (new File(sessions[i])).name);
            }

            dialog.sessions.onChange = function() {
                dialog.openBtn.enabled = true;
            }

            dialog.sessions.onDoubleClick = function() {
                dialog.openBtn.enabled = true;
                openButtonCallback(dialog.sessions.selection.text);
            }
        }

        return dialog;
    };

    /**
     * Callback to open the selected session.
     * @param filepath
     */
    var openButtonCallback = function(filepath) {

        filepath = CONFIG.SRCFOLDER + "/" + filepath;

        var theFile = new File(decodeURI(filepath));

        if (theFile.exists) {

            dialog.close();

            try {
                if (theFile.alias) {
                    while (theFile.alias) {
                        theFile = theFile.resolve().openDlg(
                            CONFIG.CHOOSE_FILE,
                            txt_filter,
                            false
                        );
                    }
                }
            }
            catch(ex) {
                dialog.msgBox.text = ex.message;
            }

            try {
                var session = Utils.read_json_file(read_file);

                if (typeof(session) == 'object') {

                    if (session.files) {
                        for(i=0; i<session.files.length; i++) {
                            var ai_file_path = decodeURIComponent(session.files[i]);
                            var the_file = new File(ai_file_path);
                            if (the_file.exists) {
                                doc = app.open(the_file);
                                app.executeMenuCommand('fitall');
                            }
                        }
                    }
                }
            }
            catch(ex) {
                dialog.msgBox.text = ex.message;
                logger.error(ex.message);
            }
        }
        else {
            logger.error(
                localize({en_US: "%1 - %2 - File `%3` does not exist."}, $.line, $.fileName, filepath)
            );
        }

        Utils.displayAlertsOn();
    };

    /**
     * Saves the current session.
     */
    var saveButtonCallback = function() {
        if (app.documents.length == 0) {
            alert(CONFIG.NO_OPEN_DOCS);
        }
        else {

            try {
                var openDocs = [];
                for (x=0; x<app.documents.length; x++) {
                    openDocs.push(
                        '"' + app.documents[x].path + "/" + app.documents[x].name + '"'
                    );
                }
                var logfolder = new Folder(CONFIG.LOGFOLDER);
                if (! logfolder.exists) {

                    logfolder.create();
                }

                var testFile = new File(CONFIG.SRCFOLDER + "/" + SESSION_FILENAME);

                var n = 1;
                var max = 100;
                while (testFile.exists && n < max) {
                    SESSION_FILENAME = "ai-" + DATE_STRING + "-r" + n + CONFIG.JSON_EXT;
                    testFile = new File(CONFIG.SRCFOLDER + "/" + SESSION_FILENAME);
                    n++;
                }

                Utils.write_file(
                    CONFIG.SRCFOLDER + "/" + SESSION_FILENAME,
                    '{"files":[\r' + '    ' + openDocs.join(',\r    ') + '\r]}',
                    true
                );

                initSessionsList(dialog);
                dialog.msgBox.text = CONFIG.SESSION_SAVED;
                dialog.saveBtn.enabled = false;
            }
            catch(ex) {
                logger.error(ex.message);
            }
        }

        Utils.displayAlertsOn();
    };

    /**
     * Converts a string, array, or object to dash-separated string.
     * @param   {string|array|object}   subject    A string, array, or object to convert to a slug.
     * @returns {string}                           The cleaned up name.
     */
    var slugger = function(subject) {
        if (typeof(subject) == "array") {
            return subject.join('-');
        }
        else if (typeof(subject) == "object") {
            var bits = [];
            for (key in subject) {
                if (typeof(subject[key]) != "string") continue;
                bits.push(subject[key].toLowerCase());
            }
            return bits.join('-');
        }
        else if (typeof(subject) == "string") {
            return decodeURIComponent(subject).replace(' ', '-');
        }
        return subject;
    };

    /**
     * Callback for sorting the file list.
     * @param   {File}  a
     * @param   {File}  b
     * @returns {number}
     */
    var comparator = function(a, b) {
        var nameA = slugger(a.name.toUpperCase());
        var nameB = slugger(b.name.toUpperCase());
        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }
        // names must be equal
        return 0;
    }

    /**
     * Returns the public module object.
     */
    return {
        /**
         * Runs the module code.
         */
        run: function() {
            new Dialog().show();
        }
    }

})(CONFIG);


/**
 * Run the module.
 */
AiSessions.run();




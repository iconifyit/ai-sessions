﻿#target illustrator/** * USAGE: *  * 1. Place both scripts in Applications > Adobe Illustrator > Presets > en_US > Scripts * 2. Restart Adobe Illustrator to activate the scripts * 3. The scripts will be available under menu File > Scripts > Session_Open and File > Scripts > Session_Save * 4. Select File > Scripts > Session_Save to save the paths of all open files as a 'Work Session' * 5. Select File > Scripts > Session_Open to re-open the files from a session. * 6. Sessions are saved in ~/ai-sessions/ai-sess-(timestamp).txt * 7. Errors are saved in ~/ai-sessions/ai-log-(timestamp).txt *//** * LICENSE & COPYRIGHT * *   You are free to use, modify, and distribute this script as you see fit.  *   No credit is required but would be greatly appreciated.  * *   Scott Lewis - scott@iconify.it *   http://github.com/iconifyit *   http://iconify.it * *   THIS SCRIPT IS OFFERED AS-IS WITHOUT ANY WARRANTY OR GUARANTEES OF ANY KIND. *   YOU USE THIS SCRIPT COMPLETELY AT YOUR OWN RISK AND UNDER NO CIRCUMSTANCES WILL  *   THE DEVELOPER AND/OR DISTRIBUTOR OF THIS SCRIPT BE HELD LIABLE FOR DAMAGES OF  *   ANY KIND INCLUDING LOSS OF DATA OR DAMAGE TO HARDWARE OR SOFTWARE. IF YOU DO  *   NOT AGREE TO THESE TERMS, DO NOT USE THIS SCRIPT. */ var originalInteractionLevel = userInteractionLevel;userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;/** * Constants */var CONST = {    LOGFOLDER:     "~/ai-sessions",    NO_OPEN_DOCS:  "There are no open docs to save for this session",    SESSION_SAVED: "The session was saved"};var timestring       = (new Date()).getTime();var session_filename = "ai-sess-" + timestring + ".txt";var session_logfile  = "ai-log-"  + timestring + ".txt";if (app.documents.length == 0) {        alert(CONST.NO_OPEN_DOCS);}else {    try {        var openDocs = [];        for (x=0; x<app.documents.length; x++) {                        openDocs.push('"' + app.documents[x].path + "/" + app.documents[x].name + '"');        }        var logfolder = new Folder(CONST.LOGFOLDER);        if (! logfolder.exists) {                logfolder.create();        }        logger(            session_filename,            "{files:[" + openDocs.join(',') + "]}"        );        alert(CONST.SESSION_SAVED);    }    catch(ex) {            logger(session_logfile, "ERROR: " + ex.message);    }    userInteractionLevel = originalInteractionLevel;}/** *  Functions */function logger(filename, txt) {      var file = new File(CONST.LOGFOLDER + "/" + filename);      file.open("e", "TEXT", "????");      file.seek(0,2);      $.os.search(/windows/i)  != -1 ? file.lineFeed = 'windows'  : file.lineFeed = 'macintosh';    file.writeln(txt);      file.close();  }
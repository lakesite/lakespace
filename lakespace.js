#!/usr/bin/env node

// #############################################################################
// lakespace
//
// given a workspace.toml toml file, open chrome/firefox windows, ide, terminals.
//
// #############################################################################
'use strict';

const path = require("path");

const argv = require('minimist')(process.argv.slice(2));

// const [,, ... args] = process.argv

var toml = require('toml');
var validUrl = require('valid-url');
var fs = require('fs');
var cp = require('child_process');

var configuration = "lakespace.toml";
var newWindow = false;
var cmdStack = [];
var browser = 'firefox';
var editor = 'atom';
var project_root = '.';
var desktop = "0";

var serialCmd = function() {
  // this works on ubuntu, required sleep or we'll miss tabs.
  var cmd = cmdStack.join(" && sleep 1 && ");
  cp.execSync(cmd);
}

var tabs = function(data) {
  Object.keys(data).forEach(function(key) {
    var val = data[key];
    if (validUrl.isUri(val)) {
      if (newWindow) {
        cmdStack.push(browser + ' -new-window "' + val + '"');
        newWindow = false;
      } else {
        cmdStack.push(browser + ' -new-tab "' + val + '"');
      }
    }
  });
}


var ide_branch = function(data) {
  Object.keys(data).forEach(function(key) {
    var val = data[key];

    if (key == 'editor') {
      editor = val;
    }

    if (key == 'project_root') {
      project_root = val;
    }
  });
}


var terminal_branch = function(data) {
  var working_directory = "~";
  var terminal_command = "gnome-terminal --window";
  var offset = "0,0";

  Object.keys(data).forEach(function(key) {
    var val = data[key];

    if (key == 'desktop') {
      cmdStack.push("sleep 1; wmctrl -r :ACTIVE: -t " + val);
    }

    if (key == 'offset') {
      offset = val;
    }

    if (key == 'working_directory') {
      working_directory = val;
    }

    if (key.startsWith('command_')) {
      terminal_command = terminal_command + " --tab --working-directory=" + working_directory + " -- bash -c \"" + val + "; bash\"";
    }
  });
  cmdStack.push(terminal_command);
  cmdStack.push("sleep 1; wmctrl -r :ACTIVE: -e 0," + offset + ",-1,-1");
}


var browser_branch = function(data) {
  Object.keys(data).forEach(function(key) {
    var val = data[key];

    if (key == 'browser') {
      browser = val;
    }

    if (key == 'tabs') {
      tabs(val);
    }

    if (key == 'editor') {
      cmdStack.push(val + ' . ');
    }
  });
}


var lakespace_branch = function(data) {
  Object.keys(data).forEach(function(key) {
    var val = data[key];

    if (key == 'desktop') {
      desktop = val;
      // pre-empt switch to desktop as normal behavior;
      cmdStack.push(`wmctrl -s ${desktop}`);
    }
  });
}


var tree = function (data) {
  Object.keys(data).forEach(function(key) {
    var val = data[key];

    // could be a new section group, flag it
    if (typeof val == 'object') {
      // so we can have multiple groups, split on _
      var index = key.split('_')[0];
      switch(index) { // key
        case 'lakespace':
          lakespace_branch(val);
          break;
        case 'ide':
          ide_branch(val);
          cmdStack.push(editor + ' ' + project_root);
          break;
        case 'terminal':
          terminal_branch(val);
        default:
          newWindow = true;
          browser_branch(val);
      }
    } // else { root property }
  });
}

if (argv["_"][0] !== undefined) {
  configuration = argv["_"][0];
}

var str = fs.readFileSync(path.resolve(process.cwd(), configuration), 'utf8')
var parsed = toml.parse(str);

tree(parsed);
serialCmd(cmdStack);

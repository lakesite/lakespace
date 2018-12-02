#!/usr/bin/env node

// #############################################################################
// lakespace
//
// given a workspace.toml toml file, open chrome/firefox windows with tabs
//
// #############################################################################
'use strict';

const [,, ... args] = process.argv

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


var tree = function (data) {
  Object.keys(data).forEach(function(key) {
    var val = data[key];

    // could be a new window group, flag it
    if (typeof val == 'object') {
      switch(key) {
        case 'ide':
          ide_branch(val);
          cmdStack.push(editor + ' ' + project_root);
          break;
        default:
          newWindow = true;
          browser_branch(val);
      }
    } // else { root property }
  });
}

if (args != '') {
  configuration = args;
}

var str = fs.readFileSync(configuration, 'utf8')
var parsed = toml.parse(str);

tree(parsed);
serialCmd(cmdStack);

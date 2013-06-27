
var stdout = process.stdout;
var NL = '\n';
var writing = false;
var lines = 0;

//Print a string to console
var print = function(string) {
  if (writing) return;

  writing = true;
  stdout.write(string);
  writing = false;
}

// Write a new line to the console
exports.line = function(string) {
  print(string + NL);
};

// Write a text to the console - no new line
exports.write = function (string) {
  print(string);
};

// Clear everything from the console
exports.clear = function(buffer) {
  print('\u001B[2J\u001B[0;0f');
};


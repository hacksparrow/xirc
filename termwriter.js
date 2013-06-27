
var stdout = process.stdout;
var NL = '\n';
var writing = false;
var lines = 0;

// Write a new line to the console
exports.line = function(string) {
  if (writing) return;

  writing = true;
  stdout.write(string + NL);
  writing = false;
};

// Write a text to the console - no new line
exports.write = function print(string) {
  if (writing) return;

  writing = true;
  stdout.write(string);
  writing = false;
};

// Clear everything from the console
exports.clear = function(buffer) {
  stdout.write('\u001B[2J\u001B[0;0f');
};


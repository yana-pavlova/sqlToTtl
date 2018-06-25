let papaparse = require('papaparse');
let fs = require('fs');
let newText = fs.readFileSync('./new.csv');
newText = newText.toString();
// newText = fs.readFileSync('./test.csv');
// newText = newText.toString();
// console.dir(newText);

papaparse.parse(newText, {
    dynamicTyping: true,
    delimiter: ",",
    header: true,
    skipEmptyLines: true,
    comments: "INS",
    encoding: "UTF-8",
    complete: function(results) {
        data = results;
        data = JSON.stringify(data, null, 2);
        fs.writeFile("newTest.json", data)
    }
});
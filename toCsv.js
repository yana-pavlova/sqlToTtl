let fs = require('fs'),
    readline = require('readline'),
    Stream = require('stream'),
    transliterate = require('transliteration').slugify,
    program = require('commander');

program
    .version('0.0.1')
    .option('-i, --input [input]', 'From sqlbase file input *.txt (default "./words-russian-fullbase.txt")', 'words-russian-fullbase.txt')
    .option('-o, --output [output]', 'output csv file *.csv  (default "./csvToNorm.csv")', 'csvToNorm.csv')
    .option('-l, --limit [limit]', 'limit of words to parse from sqlbase (default - 0/all)', 'all')
    .parse(process.argv);

let line, inStream, outStream;

console.log(
`export started 
input file: '${program.input}',
output file: '${program.output}',
parse words limit: '${program.limit}',
let's go...\n`);

function createReadStream(filename) {
    inStream = fs.createReadStream(filename);
    outStream = new Stream;
    rl = readline.createInterface(inStream, outStream);
}

createReadStream(program.input);

rl.on('line', (inStream) => {
    cvsToNormal(inStream);
});

rl.on('close', () => console.log('all done 🤘') );

function cvsToNormal(text) {
    let litera = "";
    let word = "";
    let newTest = [];
    for(let i = 0; i < text.length; i++) {
        litera = text[i];
        if (litera == "(" || litera == ")" || litera == "`" || litera == "'" || litera == " " && text[i -1] == "," || litera == ";") {
            litera = "";
        } else if(litera == ",") {
            newTest.push(word);
            word = "";
        } else if(litera == "I" && text[i + 1] == "N" && text[i + 2] == "S") {
            break;
        } else if(litera == "I" && text[i + 1] == "I" && text[i + 2] == "D") {
            break;
        } else {
            word += litera;
        }
    };
    fs.appendFileSync("new.csv", `${newTest}\n`);
    return newTest;
}
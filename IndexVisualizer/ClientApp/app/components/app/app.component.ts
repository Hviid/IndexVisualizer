import { Component } from '@angular/core';

@Component({
    selector: 'app',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    table:Row[] = [];
    cols: string[] = [];
    indexesStr: string;


    AddIndexes() {
        var indexes:Index[] = [];
        var patt = /CREATE (?:NON)?CLUSTERED INDEX ([\w|\[|\]]+)\s*ON [\w|\.|\[|\]]+\s*\(([\w|\,|\s|\[|\]]+)\)\s*(?:INCLUDE \(([\w|\,|\s|\[|\]]+)\))?/ig;
        indexes = this.getMatches(this.indexesStr, patt);

        //Get all cols
        for (let index of indexes) {
            for (var key of index.keys) {
                var existingCol = this.cols.find((col, index, all) => col == key);
                if (!existingCol)
                    this.cols.push(key);
            }
            for (var include of index.includes) {
                var existingCol = this.cols.find((col, index, all) => col == include);
                if (!existingCol)
                    this.cols.push(include);
            }
        }
        this.table = [];
        //Build table
        for (let index of indexes) {
            let row = new Row();
            row.name = index.name;
            row.cols = [];
            for (var col of this.cols) {
                row.cols.push({ name: col });
            }
            for (var key of index.keys) {
                let existingCol = row.cols.find((col, index, all) => col.name == key);
                if (existingCol)
                    existingCol.style = { 'background-color': 'green' };
            }
            for (var include of index.includes) {
                let existingCol = row.cols.find((col, index, all) => col.name == include);
                if (existingCol)
                    existingCol.style = { 'background-color': 'blue' };
            }
            this.table.push(row);
        }
    }

    getMatches(string: string, regex: RegExp, index?: number): Index [] {
        var indexes: Index[] = [];
        var match;
        while (match = regex.exec(string)) {
            let index = new Index(match[1], [], []);
            var keys = match[2];
            var includes = match[3];
            if (keys)
                index.keys = keys.split(",").map((value, index, all) => value.replace(" ASC", "").replace(" DESC", "").trim());
            if (includes)
                index.includes = includes.split(",");
            
            indexes.push(index);
        }
        return indexes;
    }
}

class Index {
    constructor(public name: string, public keys: string[], public includes: string[]) {

    }
}
class Row {
    name: string;
    cols: {name: string, style?: {} }[];
}

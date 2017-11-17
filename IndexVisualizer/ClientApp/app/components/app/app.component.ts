import { Component } from '@angular/core';

@Component({
    selector: 'app',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {

    tables: Table[] = [];
    indexesStr: string;

    AddMissingIndexes() {
        //table_name	equality_columns	inequality_columns	included_columns	user_seeks	user_scans	last_user_seek	last_user_scan	avg_total_user_cost	avg_user_impact	system_seeks	system_scans	last_system_seek	last_system_scan	avg_total_system_cost	avg_system_impact
        let patt = /(\w+)\t([\[|\w|\]|\,| ]+)\t([\[|\w|\]|\,| ]+)\t([\[|\w|\]|\,| ]+)\t(\d+)\t(\d+)\t(NULL|[\d\-]+\s[\d|\:|\.]+)\t(NULL|[\d\-]+\s[\d|\:|\.]+)\t([\d|\,]+)\t([\d|\,]+)\t(\d+)\t(\d+)\t(NULL|[\d\-]+\s[\d|\:|\.]+)\t(NULL|[\d\-]+\s[\d|\:|\.]+)\t(\d+)\t(\d+)/gi;
        let missingIndexes = this.getMissingIndexesMatches(this.indexesStr, patt);

        for (let missingIndex of missingIndexes) {
            let table = this.tables.find((table, index, tables) => table.name == missingIndex.table_name);
            if (!table) {
                table = new Table(missingIndex.table_name);
                this.tables.push(table);
            }

            let row = new Row("Missing index");
            table.rows.push(row);

            for (var key in missingIndex.stats) {
                row.indexStats[key] = missingIndex.stats[key];
            }

            for (var column of missingIndex.equality_columns) {
                let columnName = table.colNames.find((name, index, rows) => name == column);
                if (!columnName) {
                    table.colNames.push(column);
                }

                let columnStyle = row.colStyle[column];
                if (!columnStyle) {
                    columnStyle = {};
                    row.colStyle[column] = columnStyle;
                }
                
                columnStyle['background-color'] = 'green';
            }

            for (var column of missingIndex.inequality_columns) {
                let columnName = table.colNames.find((name, index, rows) => name == column);
                if (!columnName) {
                    table.colNames.push(column);
                }

                let columnStyle = row.colStyle[column];
                if (!columnStyle) {
                    columnStyle = {};
                    row.colStyle[column] = columnStyle;
                }

                columnStyle['background-color'] = 'red';
            }

            for (var column of missingIndex.included_columns) {
                let columnName = table.colNames.find((name, index, rows) => name == column);
                if (!columnName) {
                    table.colNames.push(column);
                }

                let columnStyle = row.colStyle[column];
                if (!columnStyle) {
                    columnStyle = {};
                    row.colStyle[column] = columnStyle;
                }

                columnStyle['background-color'] = 'blue';
            }

        }
        this.indexesStr = "";
    }

    AddIndexStats() {
        //table_name	index_name	dbname	user_seeks	user_scans	user_lookups	user_updates	last_user_seek	last_user_scan	last_user_lookup	last_user_update	system_seeks	system_scans	system_lookups	system_updates	last_system_seek	last_system_scan	last_system_lookup	last_system_update
        let patt = /(\w+)\t([\w|\.]+)\t\w+\t(\d+)\t(\d+)\t(\d+)\t(\d+)\t(NULL|[\d\-]+\s[\d|\:|\.]+)\t(NULL|[\d\-]+\s[\d|\:|\.]+)\t(NULL|[\d\-]+\s[\d|\:|\.]+)\t(NULL|[\d\-]+\s[\d|\:|\.]+)\t(\d+)\t(\d+)\t(\d+)\t(\d+)\t(NULL|[\d\-]+\s[\d|\:|\.]+)\t(NULL|[\d\-]+\s[\d|\:|\.]+)\t(NULL|[\d\-]+\s[\d|\:|\.]+)\t(NULL|[\d\-]+\s[\d|\:|\.]+)/gi;
        let indexesStats = this.getIndexStatMatches(this.indexesStr, patt);
        for (let indexStat of indexesStats) {

            let table = this.tables.find((table, index, tables) => table.name == indexStat.table_name);
            if (!table) {
                table = new Table(indexStat.table_name);
                this.tables.push(table);
            }

            let row = table.rows.find((row, index, rows) => row.name == indexStat.index_name);
            if (!row) {
                row = new Row(indexStat.index_name);
                table.rows.push(row);
            }

            for (var key in indexStat.stats) {
                row.indexStats[key] = indexStat.stats[key];
            }
        }
        this.indexesStr = "";
    }

    AddIndexes() {
        //table_name	index_name	column_name	fill_factor	is_included_column
        let patt = /(\w+)\t([\w|\.|\_]+)\t(\w+)\t(\d+)\t(\d+)/ig;
        let indexColumns = this.getIndexMatches(this.indexesStr, patt);
        
        for (let indexColumn of indexColumns) {

            let table = this.tables.find((table, index, tables) => table.name == indexColumn.table_name);
            if (!table) {
                table = new Table(indexColumn.table_name);
                this.tables.push(table);
            }

            let columnName = table.colNames.find((name, index, rows) => name == indexColumn.column_name);
            if (!columnName) {
                table.colNames.push(indexColumn.column_name);
            }

            let row = table.rows.find((row, index, rows) => row.name == indexColumn.index_name);
            if (!row) {
                row = new Row(indexColumn.index_name);
                table.rows.push(row);
            }

            let columnStyle = row.colStyle[indexColumn.column_name];
            if (!columnStyle) {
                columnStyle = {};
                row.colStyle[indexColumn.column_name] = columnStyle;
            }

            if (!indexColumn.is_included) {
                columnStyle['background-color'] = 'green';
            } else {
                columnStyle['background-color'] = 'blue';
            }
        }
        this.indexesStr = "";
    }

    Reset() {
        this.tables = [];
        this.indexesStr = "";
    }

    getIndexMatches(string: string, regex: RegExp): IndexColumn [] {
        var indexColumns: IndexColumn[] = [];
        var match;
        while (match = regex.exec(string)) {
            let index = new IndexColumn(match[1], match[2], match[3], parseInt(match[4]), match[5] == "1");
            indexColumns.push(index);
        }
        return indexColumns;
    }

    getIndexStatMatches(string: string, regex: RegExp): IndexStat[] {
        var indexesStats: IndexStat[] = [];
        var match;
        while (match = regex.exec(string)) {
            let index = new IndexStat(match[1], match[2], match[3], match[4], match[5], match[6], new Date(match[7]), new Date(match[8]), new Date(match[9]), new Date(match[10]), match[11], match[12], match[13], match[14], new Date(match[15]), new Date(match[16]), new Date(match[17]), new Date(match[18]));
            indexesStats.push(index);
        }
        return indexesStats;
    }

    getMissingIndexesMatches(string: string, regex: RegExp): MissingIndex[] {
        var indexesStats: MissingIndex[] = [];
        var match;
        while (match = regex.exec(string)) {
            let equality_columns = match[2].split(",").filter((str, index, all) => str !== "NULL").map((str, index, all) => str.replace("[", "").replace("]", "").trim());
            let inequality_columns = match[3].split(",").filter((str, index, all) => str !== "NULL").map((str, index, all) => str.replace("[", "").replace("]", "").trim());
            let included_columns = match[4].split(",").filter((str, index, all) => str !== "NULL").map((str, index, all) => str.replace("[", "").replace("]", "").trim());
            let index = new MissingIndex(match[1], equality_columns, inequality_columns, included_columns, match[5], match[6], new Date(match[7]), new Date(match[8]), match[9], match[10], match[11], match[12], new Date(match[13]), new Date(match[14]), match[15], match[16]);
            indexesStats.push(index);
        }
        return indexesStats;
    }
}

class IndexColumn {
    constructor(public table_name: string, public index_name: string, public column_name: string, public fill_factor: number, public is_included: boolean) {

    }
}
class MissingIndex {
    public stats: { [stat_name: string]: string; };

    constructor(public table_name: string, public equality_columns: string[], public inequality_columns: string[], public included_columns: string[], public user_seeks: string, public user_scans: string, public last_user_seek: Date,
        public last_user_scan: Date, public avg_total_user_cost: string, public avg_user_impact: string, public system_seeks: string, public system_scans: string, public last_system_seek: Date, public last_system_scan: Date,
        public avg_total_system_cost: string, public avg_system_impact: string, ) {
        let today = new Date();
        this.stats = {
            user_seeks: user_seeks,
            user_scans: user_scans,
            last_user_seek: Math.floor((today.getTime() - last_user_seek.getTime()) / (1000 * 3600 * 24)) + ' days since',
            last_user_scan: Math.floor((today.getTime() - last_user_scan.getTime()) / (1000 * 3600 * 24)) + ' days since',
            system_scans: system_scans,
            last_system_seek: Math.floor((today.getTime() - last_system_seek.getTime()) / (1000 * 3600 * 24)) + ' days since',
            last_system_scan: Math.floor((today.getTime() - last_system_scan.getTime()) / (1000 * 3600 * 24)) + ' days since',
        };
    }
}
class IndexStat {
    public stats: { [stat_name: string]: string; };

    constructor(public table_name: string, public index_name: string, public user_seeks: string, public user_scans: string, public user_lookups: string, public user_updates: string, public last_user_seek: Date, public last_user_scan: Date,
        public last_user_lookup: Date, public last_user_update: Date, public system_seeks: string, public system_scans: string, system_lookups: string, public system_updates: string, public last_system_seek: Date,
        public last_system_scan: Date, public last_system_lookup: Date, public last_system_update: Date) {
        let today = new Date();
        this.stats = {
            user_seeks: user_seeks,
            user_scans: user_scans,
            user_lookups: user_lookups,
            user_updates: user_updates,
            last_user_seek: Math.floor((today.getTime() - last_user_seek.getTime()) / (1000 * 3600 * 24)) + ' days since',
            last_user_scan: Math.floor((today.getTime() - last_user_scan.getTime()) / (1000 * 3600 * 24)) + ' days since',
            last_user_lookup: Math.floor((today.getTime() - last_user_lookup.getTime()) / (1000 * 3600 * 24)) + ' days since',
            last_user_update: Math.floor((today.getTime() - last_user_update.getTime()) / (1000 * 3600 * 24)) + ' days since',
            system_scans: system_scans,
            system_lookups: system_lookups,
            system_updates: system_updates,
            last_system_seek: Math.floor((today.getTime() - last_system_seek.getTime()) / (1000 * 3600 * 24)) + ' days since',
            last_system_scan: Math.floor((today.getTime() - last_system_scan.getTime()) / (1000 * 3600 * 24)) + ' days since',
            last_system_lookup: Math.floor((today.getTime() - last_system_lookup.getTime()) / (1000 * 3600 * 24)) + ' days since',
            last_system_update: Math.floor((today.getTime() - last_system_update.getTime()) / (1000 * 3600 * 24)) + ' days since'
        };
    }
}
class Table {
    constructor(name: string) {
        this.name = name;
        this.rows = [];
        this.colNames = [];
        this.statCols = ["user_seeks", "user_scans", "user_lookups", "user_updates", "last_user_seek", "last_user_scan", "last_user_lookup", "last_user_update", "system_seeks", "system_scans", "system_lookups", "system_updates", "last_system_seek", "last_system_scan", "last_system_lookup", "last_system_update"];
    }

    name: string;
    rows: Row[];
    colNames: string[];
    statCols: string[];
}
class Row {
    constructor(name: string) {
        this.name = name;
        this.colStyle = {};
        this.indexStats = {};
    }
    name: string;
    colStyle: { [colname: string]: Style; };
    indexStats: { [colname: string]: string; };
}
class Style {
    [styleProp: string]: string;
}

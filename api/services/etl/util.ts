import * as CSV from 'csv'; 

export const csvParse = async (buf) => {
    return new Promise((resolve, reject) => {
        CSV.parse(buf.data, {
            columns: true
        }, (err, data) => {
            if(err) return reject(err);
            return resolve(data);
        });
    });
}
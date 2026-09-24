import { Actor } from 'apify';
import { parse } from 'csv-parse/sync';
import * as https from 'https';

interface Input {
    mode?: 'preview' | 'extract';
    maxItems?: number;
    region?: string;
    departement?: string;
    commune?: string;
    type?: string[];
    stars?: string[];
    watermark?: string;
}

interface Hebergement {
    [key: string]: string | number | undefined;
}

async function fetchCSV(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to fetch CSV: ${res.statusCode}`));
                return;
            }
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve(data);
            });
        }).on('error', reject);
    });
}

function extractDepartement(codePostal: string): string {
    if (!codePostal || codePostal.length < 2) return '';
    const dept = codePostal.substring(0, 2);
    return dept;
}

function extractRegion(codePostal: string): string {
    if (!codePostal || codePostal.length < 2) return '';
    const dept = codePostal.substring(0, 2);
    
    const regionMap: { [key: string]: string } = {
        '01': 'Auvergne-Rhône-Alpes', '03': 'Auvergne-Rhône-Alpes', '07': 'Auvergne-Rhône-Alpes', '15': 'Auvergne-Rhône-Alpes',
        '26': 'Auvergne-Rhône-Alpes', '38': 'Auvergne-Rhône-Alpes', '42': 'Auvergne-Rhône-Alpes', '43': 'Auvergne-Rhône-Alpes',
        '63': 'Auvergne-Rhône-Alpes', '69': 'Auvergne-Rhône-Alpes', '73': 'Auvergne-Rhône-Alpes', '74': 'Auvergne-Rhône-Alpes',
        '21': 'Bourgogne-Franche-Comté', '25': 'Bourgogne-Franche-Comté', '39': 'Bourgogne-Franche-Comté', '58': 'Bourgogne-Franche-Comté',
        '70': 'Bourgogne-Franche-Comté', '71': 'Bourgogne-Franche-Comté', '89': 'Bourgogne-Franche-Comté', '90': 'Bourgogne-Franche-Comté',
        '22': 'Bretagne', '29': 'Bretagne', '35': 'Bretagne', '56': 'Bretagne',
        '18': 'Centre-Val de Loire', '28': 'Centre-Val de Loire', '36': 'Centre-Val de Loire', '37': 'Centre-Val de Loire',
        '41': 'Centre-Val de Loire', '45': 'Centre-Val de Loire',
        '08': 'Grand Est', '10': 'Grand Est', '51': 'Grand Est', '52': 'Grand Est', '54': 'Grand Est',
        '55': 'Grand Est', '57': 'Grand Est', '67': 'Grand Est', '68': 'Grand Est', '88': 'Grand Est',
        '02': 'Hauts-de-France', '59': 'Hauts-de-France', '60': 'Hauts-de-France', '62': 'Hauts-de-France', '80': 'Hauts-de-France',
        '75': 'Île-de-France', '77': 'Île-de-France', '78': 'Île-de-France', '91': 'Île-de-France',
        '92': 'Île-de-France', '93': 'Île-de-France', '94': 'Île-de-France', '95': 'Île-de-France',
        '14': 'Normandie', '27': 'Normandie', '50': 'Normandie', '61': 'Normandie', '76': 'Normandie',
        '16': 'Nouvelle-Aquitaine', '17': 'Nouvelle-Aquitaine', '19': 'Nouvelle-Aquitaine', '23': 'Nouvelle-Aquitaine',
        '24': 'Nouvelle-Aquitaine', '33': 'Nouvelle-Aquitaine', '40': 'Nouvelle-Aquitaine', '47': 'Nouvelle-Aquitaine',
        '64': 'Nouvelle-Aquitaine', '79': 'Nouvelle-Aquitaine', '86': 'Nouvelle-Aquitaine', '87': 'Nouvelle-Aquitaine',
        '09': 'Occitanie', '11': 'Occitanie', '12': 'Occitanie', '30': 'Occitanie', '31': 'Occitanie',
        '32': 'Occitanie', '34': 'Occitanie', '46': 'Occitanie', '48': 'Occitanie', '65': 'Occitanie',
        '66': 'Occitanie', '81': 'Occitanie', '82': 'Occitanie',
        '44': 'Pays de la Loire', '49': 'Pays de la Loire', '53': 'Pays de la Loire', '72': 'Pays de la Loire', '85': 'Pays de la Loire',
        '04': 'Provence-Alpes-Côte d\'Azur', '05': 'Provence-Alpes-Côte d\'Azur', '06': 'Provence-Alpes-Côte d\'Azur',
        '13': 'Provence-Alpes-Côte d\'Azur', '83': 'Provence-Alpes-Côte d\'Azur', '84': 'Provence-Alpes-Côte d\'Azur',
        '2A': 'Corse', '2B': 'Corse', '20': 'Corse',
        '971': 'Guadeloupe', '972': 'Martinique', '973': 'Guyane', '974': 'La Réunion', '976': 'Mayotte'
    };
    
    if (codePostal.startsWith('97') || codePostal.startsWith('98')) {
        const deptCode = codePostal.substring(0, 3);
        return regionMap[deptCode] || '';
    }
    
    return regionMap[dept] || '';
}

function normalizeString(str: string): string {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function matchesFilter(value: string | undefined, filter: string): boolean {
    if (!filter || !value) return true;
    return normalizeString(value).includes(normalizeString(filter));
}

function matchesArrayFilter(value: string | undefined, filters: string[]): boolean {
    if (!filters || filters.length === 0) return true;
    if (!value) return false;
    
    const normalizedValue = normalizeString(value);
    return filters.some(filter => normalizedValue.includes(normalizeString(filter)));
}

Actor.main(async () => {
    const input = await Actor.getInput<Input>() || {};
    
    const {
        mode = 'preview',
        maxItems = 50,
        region = '',
        departement = '',
        commune = '',
        type = [],
        stars = [],
        watermark = ''
    } = input;

    const effectiveMaxItems = mode === 'preview' ? Math.min(5, maxItems || 5) : (maxItems || 0);

    console.log('Starting Atout France scraper', {
        mode,
        maxItems: effectiveMaxItems,
        filters: { region, departement, commune, type, stars }
    });

    const csvUrl = 'https://data.classement.atout-france.fr/static/exportHebergementsClasses/hebergements_classes.csv';
    
    console.log('Fetching CSV data...');
    const csvData = await fetchCSV(csvUrl);
    
    console.log('Parsing CSV...');
    const records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        delimiter: ';',
        relax_column_count: true,
        skip_records_with_error: true
    }) as Hebergement[];

    console.log(`Total records in CSV: ${records.length}`);

    let filtered: Hebergement[] = records;
    let pushed = 0;

    for (const record of filtered) {
        if (effectiveMaxItems > 0 && pushed >= effectiveMaxItems) {
            console.log(`Reached maxItems limit (${effectiveMaxItems}), stopping.`);
            break;
        }

        const codePostal = record['CODE POSTAL'] as string;
        const recordRegion = extractRegion(codePostal);
        const recordDepartement = extractDepartement(codePostal);

        if (region && !matchesFilter(recordRegion, region)) continue;
        if (departement && !matchesFilter(recordDepartement, departement)) continue;
        if (commune && !matchesFilter(record['COMMUNE'] as string, commune)) continue;
        
        if (type.length > 0 && !matchesArrayFilter(record['TYPOLOGIE ÉTABLISSEMENT'] as string, type)) continue;
        if (stars.length > 0 && !matchesArrayFilter(record['CLASSEMENT'] as string, stars)) continue;

        const item = watermark 
            ? { ...record, region: recordRegion, departement: recordDepartement, watermark }
            : { ...record, region: recordRegion, departement: recordDepartement };

        await Actor.pushData(item);
        pushed++;

        if (pushed % 100 === 0) {
            console.log(`Pushed ${pushed} items...`);
        }
    }

    console.log(`Scraping completed. Total items pushed: ${pushed}`);
    
    await Actor.setValue('OUTPUT', {
        totalRecords: records.length,
        itemsPushed: pushed,
        mode,
        filters: { region, departement, commune, type, stars }
    });
});

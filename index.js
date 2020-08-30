const fetch = require('node-fetch');
const cheerio = require('cheerio');

exports.handler = async function handler(event) {
    const sales = [];
    const listings = [];
    let actives = 0;

    const response = await fetch('https://www.zillow.com/profile/Frederick-S-Ritter/', {
        headers: {
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'accept-encoding': 'gzip, deflate, sdch, br',
            'accept-language': 'en-US,en;q=0.8,en-US;q=0.6,ml;q=0.4',
            'cache-control': 'max-age=0',
            'upgrade-insecure-requests': '1',
            'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
        }
    });
    const body = await response.text();
    const $ = cheerio.load(body);

    if ($('.all-time').length > 1) actives = parseInt($('.all-time').first().text().slice(1, -1));

    $('.address-street').each(function (i, elem) {
        i < actives ? (
            listings.push({
                url: 'https://www.zillow.com' + $(this).parent().attr('href'),
                address1: $(this).text(),
                address2: $(this).next().next().text()
            })) : (
            sales.push({
                url: 'https://www.zillow.com' + $(this).parent().attr('href'),
                address1: $(this).text(),
                address2: $(this).next().next().text()
            }));
    });

    $('.sh-rep').each(function (i, elem) {
        if (i !== 0) sales[i - 1]['represented'] = $(this).text();
    });

    $('.sh-sold-date').each(function (i, elem) {
        if (i !== 0) sales[i - 1]['dateSold'] = $(this).text();
    });

    if (actives) {
        $('.al-bed-bath').each(function (i, elem) {
            if (i !== 0) listings[i - 1]['bedsBaths'] = $(this).text();
        });
    }

    $('.sh-sold-price').each(function (i, elem) {
        i < actives + 1 ? (
            (i !== 0) && (listings[i - 1]['price'] = $(this).text().trimLeft().split(' ')[0])
        ) : (
            (i !== actives + 1) && (sales[i - (actives + 2)]['price'] = $(this).text().trimLeft().split(' ')[0])
        );
    });

    return { listings, sales }
}
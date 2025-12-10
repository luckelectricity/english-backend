/**
 * 爬取牛津3000词列表
 * 运行: node scripts/scrape-oxford-3000.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function parseWords(html) {
    const words = [];

    // 匹配表格行: <tr><td><a>word</a></td><td>pos</td><td><span>level</span></td></tr>
    const trRegex = /<tr>\s*<td><a[^>]*>([^<]+)<\/a><\/td>\s*<td>([^<]+)<\/td>\s*<td><span>([^<]+)<\/span><\/td>\s*<\/tr>/g;

    let match;
    let rank = 1;

    while ((match = trRegex.exec(html)) !== null) {
        const text = match[1].trim();
        const partOfSpeech = match[2].trim();
        const level = match[3].trim();

        words.push({
            rank,
            text,
            partOfSpeech,
            level
        });

        rank++;
    }

    return words;
}

async function main() {
    console.log('开始爬取牛津3000词...');

    const url = 'https://lightdictionary.com/oxford-3000/';
    const html = await fetchPage(url);

    const words = parseWords(html);

    console.log(`爬取完成,共 ${words.length} 个单词`);

    // 保存为 JSON
    const outputPath = path.join(__dirname, '../data/oxford-3000.json');
    fs.writeFileSync(outputPath, JSON.stringify(words, null, 2));

    console.log(`已保存到: ${outputPath}`);

    // 统计
    const stats = words.reduce((acc, w) => {
        acc[w.level] = (acc[w.level] || 0) + 1;
        return acc;
    }, {});

    console.log('\n等级分布:');
    Object.entries(stats).sort().forEach(([level, count]) => {
        console.log(`  ${level}: ${count} 个`);
    });

    // 显示前10个单词
    console.log('\n前10个单词:');
    words.slice(0, 10).forEach(w => {
        console.log(`  ${w.rank}. ${w.text} (${w.partOfSpeech}) - ${w.level}`);
    });
}

main().catch(console.error);

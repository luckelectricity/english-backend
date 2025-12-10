/**
 * 导入牛津3000词到数据库
 * 运行: node scripts/import-oxford-3000.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
    console.log('开始导入牛津3000词...');

    // 读取 JSON 文件
    const jsonPath = path.join(__dirname, '../data/oxford-3000.json');
    const words = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    console.log(`读取到 ${words.length} 个单词`);

    // 批量导入
    let imported = 0;
    let skipped = 0;

    for (const word of words) {
        try {
            await prisma.oxfordWord.create({
                data: {
                    text: word.text,
                    partOfSpeech: word.partOfSpeech,
                    level: word.level,
                    rank: word.rank
                }
            });
            imported++;

            if (imported % 500 === 0) {
                console.log(`已导入 ${imported}/${words.length}...`);
            }
        } catch (error) {
            // 忽略重复数据
            if (error.code === 'P2002') {
                skipped++;
            } else {
                console.error(`导入失败: ${word.text}`, error.message);
            }
        }
    }

    console.log(`\n导入完成!`);
    console.log(`  成功: ${imported} 个`);
    console.log(`  跳过: ${skipped} 个`);

    // 统计
    const stats = await prisma.oxfordWord.groupBy({
        by: ['level'],
        _count: true
    });

    console.log('\n数据库中的等级分布:');
    stats.sort((a, b) => a.level.localeCompare(b.level)).forEach(s => {
        console.log(`  ${s.level}: ${s._count} 个`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

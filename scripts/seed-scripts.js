
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const scripts = [
    {
        id: 'script-1-fb-auto',
        title: "Facebook Auto Tool",
        description: "Automate friend requests, posts, and group interactions safely.",
        price: 15.00,
        version: "1.0.0",
        fileUrl: "https://example.com/files/fb-auto.zip"
    },
    {
        id: 'script-2-insta-pro',
        title: "Instagram Scraper Pro",
        description: "Extract followers, comments, and hashtags with high speed.",
        price: 25.00,
        version: "2.1.0",
        fileUrl: "https://example.com/files/insta-pro.zip"
    },
    {
        id: 'script-3-wifi-hacker',
        title: "Termux WiFi Hacker",
        description: "Educational tool for testing network security vulnerabilities.",
        price: 10.00,
        version: "1.5.0",
        fileUrl: "https://example.com/files/wifi-hacker.zip"
    },
    {
        id: 'script-4-wa-bot',
        title: "WhatsApp Spammer Bot",
        description: "Automated messaging tool for marketing campaigns.",
        price: 20.00,
        version: "3.0.0",
        fileUrl: "https://example.com/files/wa-bot.zip"
    },
    {
        id: 'script-5-daily-checkin',
        title: "Auto Daily Check-in",
        description: "Automatically check-in to multiple platforms and earn rewards.",
        price: 12.00,
        version: "1.2.0",
        fileUrl: "https://example.com/files/daily-checkin.zip"
    },
    {
        id: 'script-6-crypto-tx',
        title: "Crypto Auto Transaction",
        description: "Automate your crypto transactions with smart triggers.",
        price: 35.00,
        version: "1.0.0",
        fileUrl: "https://example.com/files/crypto-tx.zip"
    },
    {
        id: 'script-7-refer-bot',
        title: "Referral Bot Pro",
        description: "Generate referral codes and automate refer tasks.",
        price: 18.00,
        version: "2.0.0",
        fileUrl: "https://example.com/files/refer-bot.zip"
    },
    {
        id: 'script-8-node-tool',
        title: "Node.js CLI Toolkit",
        description: "Collection of CLI tools for developers built with Node.js.",
        price: 22.00,
        version: "4.0.0",
        fileUrl: "https://example.com/files/node-tool.zip"
    }
];

async function seedScripts() {
    try {
        console.log('Seeding scripts...');
        for (const script of scripts) {
            await prisma.script.upsert({
                where: { id: script.id },
                update: script,
                create: script
            });
            console.log(`Synced: ${script.title}`);
        }
        console.log('✅ Scripts seeded successfully!');
    } catch (error) {
        console.error('Error seeding scripts:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedScripts();

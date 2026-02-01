import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 データベースのシード処理を開始します...');

  // パスワードのハッシュ化
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 営業マスタのシードデータ作成
  console.log('📊 営業マスタのデータを作成中...');

  // 部長
  const director = await prisma.sales.upsert({
    where: { email: 'watanabe@example.com' },
    update: {},
    create: {
      name: '渡辺 部長',
      email: 'watanabe@example.com',
      password: hashedPassword,
      department: '営業部',
      position: '部長',
    },
  });

  // 課長（営業第一部）
  const manager1 = await prisma.sales.upsert({
    where: { email: 'sato-k@example.com' },
    update: {},
    create: {
      name: '佐藤 課長',
      email: 'sato-k@example.com',
      password: hashedPassword,
      department: '営業第一部',
      position: '課長',
      managerId: director.id,
    },
  });

  // 課長（営業第二部）
  const manager2 = await prisma.sales.upsert({
    where: { email: 'takahashi@example.com' },
    update: {},
    create: {
      name: '高橋 課長',
      email: 'takahashi@example.com',
      password: hashedPassword,
      department: '営業第二部',
      position: '課長',
      managerId: director.id,
    },
  });

  // 一般営業（営業第一部）
  const sales1 = await prisma.sales.upsert({
    where: { email: 'yamada@example.com' },
    update: {},
    create: {
      name: '山田 太郎',
      email: 'yamada@example.com',
      password: hashedPassword,
      department: '営業第一部',
      position: '一般',
      managerId: manager1.id,
    },
  });

  await prisma.sales.upsert({
    where: { email: 'suzuki@example.com' },
    update: {},
    create: {
      name: '鈴木 一郎',
      email: 'suzuki@example.com',
      password: hashedPassword,
      department: '営業第一部',
      position: '一般',
      managerId: manager1.id,
    },
  });

  // 一般営業（営業第二部）
  await prisma.sales.upsert({
    where: { email: 'tanaka@example.com' },
    update: {},
    create: {
      name: '田中 花子',
      email: 'tanaka@example.com',
      password: hashedPassword,
      department: '営業第二部',
      position: '一般',
      managerId: manager2.id,
    },
  });

  await prisma.sales.upsert({
    where: { email: 'sato@example.com' },
    update: {},
    create: {
      name: '佐藤 次郎',
      email: 'sato@example.com',
      password: hashedPassword,
      department: '営業第二部',
      position: '一般',
      managerId: manager2.id,
    },
  });

  console.log('✅ 営業マスタのデータ作成完了');

  // 顧客マスタのシードデータ作成
  console.log('📊 顧客マスタのデータを作成中...');

  const customer1 = await prisma.customer.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: '株式会社ABC商事',
      contactPerson: '山田 一郎',
      phone: '03-1234-5678',
      address: '東京都千代田区丸の内1-1-1',
      industry: '卸売業',
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'DEF株式会社',
      contactPerson: '鈴木 花子',
      phone: '03-2345-6789',
      address: '東京都港区六本木1-1-1',
      industry: '製造業',
    },
  });

  const customer3 = await prisma.customer.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'GHI工業株式会社',
      contactPerson: '田中 次郎',
      phone: '03-3456-7890',
      address: '東京都品川区大井1-1-1',
      industry: '製造業',
    },
  });

  await prisma.customer.upsert({
    where: { id: 4 },
    update: {},
    create: {
      name: 'JKL商事',
      contactPerson: '佐藤 美咲',
      phone: '03-4567-8901',
      address: '東京都渋谷区渋谷1-1-1',
      industry: '小売業',
    },
  });

  await prisma.customer.upsert({
    where: { id: 5 },
    update: {},
    create: {
      name: 'MNO株式会社',
      contactPerson: '高橋 健太',
      phone: '03-5678-9012',
      address: '東京都新宿区西新宿1-1-1',
      industry: 'IT業',
    },
  });

  console.log('✅ 顧客マスタのデータ作成完了');

  // サンプル日報データの作成
  console.log('📊 サンプル日報データを作成中...');

  const dailyReport1 = await prisma.dailyReport.create({
    data: {
      salesId: sales1.id,
      reportDate: new Date('2026-02-01'),
      visitRecords: {
        create: [
          {
            customerId: customer1.id,
            visitContent:
              '新商品のプレゼンテーションを実施。先方の反応は良好で、次回は見積書を持参することで合意。',
            visitStartTime: '10:00:00',
            visitEndTime: '11:30:00',
          },
          {
            customerId: customer2.id,
            visitContent: '定例訪問。前回の案件の進捗確認を実施。',
            visitStartTime: '13:30:00',
            visitEndTime: '14:30:00',
          },
          {
            customerId: customer3.id,
            visitContent: '価格交渉。競合他社との比較検討中とのこと。',
            visitStartTime: '15:30:00',
            visitEndTime: '17:00:00',
          },
        ],
      },
      problems: {
        create: [
          {
            content:
              'GHI工業との価格交渉について。競合他社より10%高い見積もりとなっているため、値引き交渉の承認をいただきたい。',
          },
          {
            content:
              '新規開拓のアプローチ方法について。製造業の新規開拓が進んでいません。効果的なアプローチ方法についてアドバイスをお願いします。',
          },
        ],
      },
      plans: {
        create: [
          {
            content: 'ABC商事へ見積書提出。新商品の見積書を作成し、午前中に訪問予定。',
          },
          {
            content: '社内ミーティング参加。営業部門の週次ミーティング(14:00-15:00)',
          },
        ],
      },
    },
  });

  // Problemへのコメント追加
  const problem = await prisma.problem.findFirst({
    where: { dailyReportId: dailyReport1.id },
  });

  if (problem) {
    await prisma.comment.create({
      data: {
        targetType: 'PROBLEM',
        targetId: problem.id,
        commenterId: manager1.id,
        content:
          '5%までの値引きであれば承認します。それ以上は本部承認が必要です。明日、詳細を相談しましょう。',
      },
    });
  }

  console.log('✅ サンプル日報データ作成完了');

  console.log('🎉 シード処理が完了しました！');
  console.log('');
  console.log('📝 作成されたデータ:');
  console.log(`   - 営業マスタ: 7件`);
  console.log(`   - 顧客マスタ: 5件`);
  console.log(`   - 日報: 1件`);
  console.log(`   - 訪問記録: 3件`);
  console.log(`   - Problem: 2件`);
  console.log(`   - Plan: 2件`);
  console.log(`   - コメント: 1件`);
  console.log('');
  console.log('🔐 ログイン情報:');
  console.log('   メールアドレス: yamada@example.com');
  console.log('   パスワード: password123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ エラーが発生しました:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

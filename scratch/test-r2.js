import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

const r2AccountId = process.env.R2_ACCOUNT_ID;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;

async function test() {
    console.log('--- TESTE R2 ---');
    console.log('Account ID:', r2AccountId);
    console.log('Access Key:', r2AccessKeyId);
    console.log('Bucket:', bucketName);

    const s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: r2AccessKeyId,
            secretAccessKey: r2SecretAccessKey
        }
    });

    try {
        await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
        console.log('✅ SUCESSO: Conexão ok e Bucket encontrado!');
    } catch (err) {
        console.error('❌ ERRO NO TESTE:', err.name, '-', err.message);
        if (err.name === 'NotFound') {
            console.log('👉 DICA: O bucket "' + bucketName + '" não existe na sua conta. Verifique o nome!');
        } else if (err.name === 'InvalidAccessKeyId' || err.name === 'SignatureDoesNotMatch') {
            console.log('👉 DICA: As chaves estão incorretas ou foram copiadas com espaços.');
        }
    }
}

test();

// netlify/functions/comment.js
const { handler: walineHandler } = require('@waline/vercel');

// 确保环境变量存在 (检查我们设置的核心变量)
if (!process.env.MONGODB_URI) {
    console.error('环境变量 MONGODB_URI 未设置！');
}

// 关键点：覆盖默认的连接池设置
process.env.MONGO_OPTIONS = JSON.stringify({
    // 限制最大连接数为 1，防止在无服务器环境中产生过多连接[reference:5]
    maxPoolSize: 1,
    // 设置空闲连接在关闭前应保留的最长时间 (毫秒)
    maxIdleTimeMS: 10000,
    // 连接超时时间 (毫秒)，设置得长一些以应对网络波动
    connectTimeoutMS: 30000,
    // Socket 超时时间 (毫秒)
    socketTimeoutMS: 30000,
    // Netlify 函数的核心修复：告诉驱动尽快关闭连接，不让函数挂起[reference:6]
    // 注意：这个参数的效果可能因 MongoDB Node.js 驱动版本而异
});

// 导出一个包装后的 handler
exports.handler = async (event, context) => {
    // 告诉 Netlify 不要等待空的事件循环，允许数据库连接正常关闭
    context.callbackWaitsForEmptyEventLoop = false;

    try {
        return await walineHandler(event, context);
    } catch (error) {
        console.error('Waline handler error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: '评论服务内部错误' }),
        };
    }
};

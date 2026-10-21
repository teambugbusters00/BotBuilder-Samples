'use strict';

const assert = require('assert');
const { sendProactiveMessages } = require('../bots/proactiveMessageSender');

async function runTests() {
    const errors = [];
    const logger = { error: (...args) => errors.push(args) };

    // A failed conversation must not prevent later conversations from being attempted.
    const attempted = [];
    const summary = await sendProactiveMessages({
        conversationReferences: {
            first: { id: 'first' },
            second: { id: 'second' },
            third: { id: 'third' }
        },
        continueConversation: async (reference, callback) => {
            attempted.push(reference.id);
            if (reference.id === 'second') {
                throw new Error('simulated delivery failure');
            }
            await callback({
                sendActivity: async message => assert.strictEqual(message, 'proactive hello')
            });
        },
        logger
    });

    assert.deepStrictEqual(attempted, ['first', 'second', 'third']);
    assert.deepStrictEqual(summary, { attempted: 3, sent: 2, failed: 1 });
    assert.strictEqual(errors.length, 1);
    assert.ok(String(errors[0][1]).includes('simulated delivery failure'));

    // Empty input is a successful no-op.
    const emptySummary = await sendProactiveMessages({
        conversationReferences: {},
        continueConversation: async () => {
            throw new Error('must not be called');
        },
        logger
    });
    assert.deepStrictEqual(emptySummary, { attempted: 0, sent: 0, failed: 0 });

    // Array input is also supported.
    const arraySummary = await sendProactiveMessages({
        conversationReferences: [{ id: 'only' }],
        continueConversation: async (_reference, callback) => callback({ sendActivity: async () => {} }),
        logger
    });
    assert.deepStrictEqual(arraySummary, { attempted: 1, sent: 1, failed: 0 });

    console.log('All proactive message sender tests passed.');
}

runTests().catch(error => {
    console.error(error);
    process.exitCode = 1;
});

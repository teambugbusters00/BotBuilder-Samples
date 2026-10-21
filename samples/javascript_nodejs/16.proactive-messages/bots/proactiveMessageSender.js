// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const DEFAULT_MESSAGE = 'proactive hello';

/**
 * Attempt to send a proactive message to every stored conversation reference.
 * A failure for one conversation is recorded without preventing later attempts.
 *
 * @param {Object} options
 * @param {Object|Array} options.conversationReferences Stored conversation references.
 * @param {Function} options.continueConversation Adapter continuation function.
 * @param {Object} [options.logger=console] Logger with an error method.
 * @param {string} [options.message] Message to send.
 * @returns {Promise<{attempted: number, sent: number, failed: number}>}
 */
async function sendProactiveMessages({
    conversationReferences,
    continueConversation,
    logger = console,
    message = DEFAULT_MESSAGE
}) {
    const references = Array.isArray(conversationReferences)
        ? conversationReferences
        : Object.values(conversationReferences || {});

    const summary = { attempted: 0, sent: 0, failed: 0 };

    for (const [index, reference] of references.entries()) {
        summary.attempted += 1;

        try {
            await continueConversation(reference, async turnContext => {
                await turnContext.sendActivity(message);
            });
            summary.sent += 1;
        } catch (error) {
            summary.failed += 1;
            logger.error(
                `Failed to send proactive message for conversation reference at index ${index}.`,
                error
            );
        }
    }

    return summary;
}

module.exports = { sendProactiveMessages };

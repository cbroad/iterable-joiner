/**
 * {@link https://stackoverflow.com/questions/63540256/parallel-concurrent-method-execution-in-javascript StackOverFlow Question}
 * 
 * This would be made more interesting by the makeRequest function have some asynchronous aspect to it, but it did not.
 */

const { IterableJoiner } = require( "iterable-joiner" );

const printInHandler = false; // false means we will behave how the implementation in the question was written.

function makeRequest(letter) {
    return {
        * [Symbol.iterator]() {
            var rand = Math.random() * 999;
            for(var i = 0; i < rand; i++){

                // Original question printed to console here, I prefer yielding the value and printing it in handler().
                if( printInHandler ) {
                    yield i + " " + letter;
                } else {
                    yield;
                    console.log( i + " " + letter );
                }


            }
        }
    };
}


( async function handler() {
    let arrayOfIterables = [
       makeRequest('a'),
       makeRequest('b'),
       makeRequest('c'),
       makeRequest('d'),
       makeRequest('e'),
    ];
                
    const iterator = IterableJoiner.Sync.Equitable.join( ...arrayOfIterables );

    for( const message of iterator ) {
        if( printInHandler ) {
            console.log( message );  // Use this if printing in handler()
        }
    }
   console.log(`processing is complete`);
} )();
const { IterableJoiner } = require( "iterable-joiner" );

class LabeledCounter {
    label = "";
    count = 100;
    timeout = 100;

    constructor( label, count, timeout ) {
        this.label = label;
        this.count = count;
        this.timeout = timeout;
    }

    async *[Symbol.asyncIterator]() {
        const queue = [];
        for( let i=0 ; i<this.count ; i++ ) {
            const value = `${this.label}: ${i}`;
            queue.push( value );
        }
        while( queue.length ) {
            yield queue.shift();
            // await sleep( Math.floor( this.timeout*Math.random() ) );

            // console.log( `sleep ${this.label} ${this.timeout}` );  // This line makes a difference in ordering with the Priority Joiner
            await sleep( this.timeout );
        }
    }

}

async function sleep( ms ) { return new Promise( ( resolve ) => setTimeout( resolve, ms ) ); }



( async function main() {
    const count = 100;
    const L = new LabeledCounter( "L", count, 10 );
    const C = new LabeledCounter( "C", count, 10 );
    const R = new LabeledCounter( "R", count, 10 );
    const joiner = IterableJoiner.Async.Priority.join( L, C, R );
    for await (const item of joiner ) {
        console.log( item );
        // console.log( "sleep 5" );
        await sleep( 5 ); // With a sleep value of 5 here,  WHen using a Priority Joiner, R won't be used until L is completed.
    }
} )();
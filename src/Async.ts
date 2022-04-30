import { Mutex } from "semasync";

export type IterableJoinerState<T> = {
    iterableStates : IterableStatus<T>[];
    mergeMutex     : Mutex;
    running        : boolean;
};

export type IterableStatus<T> = {
    item     : T|undefined;
    iterable : AsyncIterable<T>;
    mutex    : Mutex;
    ready    : boolean;
    running  : boolean;
};


export abstract class Abstract<T> implements AsyncIterable<T> {
    
    #iterables:AsyncIterable<T>[];
    #handlers: { add:((iterable:AsyncIterable<T>)=>boolean)[], remove:((iterable:AsyncIterable<T>)=>boolean)[] } = {
        add: [],
        remove: [],
    };

    public constructor();
    public constructor( iterable1:AsyncIterable<T>, iterable2:AsyncIterable<T> );
    public constructor( ...iterables:AsyncIterable<T>[] );
    public constructor( ...iterables:AsyncIterable<T>[] ) {
        this.#iterables = iterables;
    }

    get iterables():readonly AsyncIterable<T>[] {
        return this.#iterables;
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T, any, undefined> {
        const self = this;
        const state:IterableJoinerState<T> = { iterableStates: [], mergeMutex: new Mutex(), running: true, };

        state.mergeMutex.acquire();
        this.#iterables.map( startIterating );

        this.#handlers.add.push( startIterating );
        this.#handlers.remove.push( stopIterating );

        yield* this.merge( state );

        this.#handlers.add.splice( this.#handlers.add.indexOf(startIterating), 1 );
        this.#handlers.remove.splice( this.#handlers.remove.indexOf(startIterating), 1 );

        function startIterating( iterable:AsyncIterable<T> ):boolean {
            let idx = self.iterables.reduce( (R, it, idx) => it===iterable?idx:R, -1 );
            if( idx===-1 ) {
                return false;
            }
            const status:IterableStatus<T> = { item:undefined, iterable, mutex: new Mutex(), ready:false, running:true };
            state.iterableStates.splice( idx, 0, status );
            state.running = true;
            status.mutex.acquire();

            ( async () => {
                for await ( const item of iterable ) {
                    status.item = item;
                    status.ready = true;
                    if( state.mergeMutex.waiting ) {
                        state.mergeMutex.release();
                    }
                    await status.mutex.acquire();
                    if( status.running===false ) {
                        break;
                    }
                }
                if( status.running===true ) {
                    stopIterating( iterable );
                }
            } )();
            return true;
        }

        function stopIterating( iterable:AsyncIterable<T> ):boolean {
            let idx = state.iterableStates.reduce( (R, status, idx) => status.iterable===iterable?idx:R, -1 );
            if( idx>=0 ) {
                const [ status ] = state.iterableStates.splice( idx, 1 );
                status.running = false;
                status.mutex.release();
                state.running = ( state.iterableStates.some( ( status ) => status.running ) );
                if( state.running && state.mergeMutex.waiting ) {
                    state.mergeMutex.release();
                }
                return true;
            }
            return false;
        }

    }

    protected abstract merge( state:IterableJoinerState<T> ): AsyncIterable<T>;

    public addIterable( it:AsyncIterable<T> ):boolean;
    public addIterable( it:AsyncIterable<T>, idx:number ):boolean;
    public addIterable( it:AsyncIterable<T>, idx:number=this.#iterables.length ):boolean {
        console.log( "addIterable" );

        if( isAsyncIterable( it )===false || this.#iterables.includes( it ) === true ) {
            return false;
        }

        if( typeof idx !== "number" ) {
            return false;
        } else {
            if( idx<0 ) {
                idx = 0;
            } else if( idx>this.#iterables.length ) {
                idx = this.#iterables.length;
            }
        }

        this.#iterables.splice( idx, 0, it );
        this.#handlers.add.forEach( f => f( it ) );
        return true;
    }

    public removeIterable( it:AsyncIterable<T> ):boolean {
        console.log( "removeIterable" );
        
        if( isAsyncIterable( it )===false || this.#iterables.includes( it )===false ) {
            return false;
        }

        this.#iterables.splice( this.#iterables.indexOf( it ), 1 );
        this.#handlers.remove.forEach( f => f( it ) );
        return true;
    }
    
}

export class Equitable<T> extends Abstract<T> {
    
    protected priority:boolean = false;

    public static join():AsyncIterable<any>;
    public static join( iterable:AsyncIterable<any> ):AsyncIterable<any>;
    public static join( ...iterables:AsyncIterable<any>[] ):AsyncIterable<any> {
        return new Equitable( ...iterables );
    }

    protected merge( state:IterableJoinerState<T> ): AsyncIterable<T> {
        const priority = this.priority;
        return {
            async *[Symbol.asyncIterator]():AsyncIterator<T, any, undefined> {
                while( state.iterableStates.length ) {
                    if( state.iterableStates.every( ( status ) => status.ready===false ) ) {
                        await state.mergeMutex.acquire();
                    }
                    for( const status of state.iterableStates ) {
                        if( status.ready ) {
                            const item = status.item!;
                            status.item = undefined;
                            status.ready = false;
                            if( status.mutex.waiting ) {
                                status.mutex.release();
                            }
                            yield item;
                            if( priority ) {
                                break;
                            }
                        }
                    }
                }
            }
        };
    }
}


export class Priority<T> extends Equitable<T> {
    protected priority:boolean = true;
    
    public static join():AsyncIterable<any>;
    public static join( iterable:AsyncIterable<any> ):AsyncIterable<any>;
    public static join( ...iterables:AsyncIterable<any>[] ):AsyncIterable<any> {
        return new Priority( ...iterables );
    }
}

function isAsyncIterable( value:any ):boolean {
    return value.hasOwnProperty(Symbol.asyncIterator);
}
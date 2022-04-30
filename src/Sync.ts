export abstract class Abstract<T> implements Iterable<T> {
    
    #iterables:Iterable<T>[];
    #handlers: { add:((iterable:Iterable<T>)=>boolean)[], remove:((iterable:Iterable<T>)=>boolean)[] } = {
        add: [],
        remove: [],
    };

    public constructor();
    public constructor( iterable1:Iterable<T>, iterable2:Iterable<T> );
    public constructor( ...iterables:Iterable<T>[] );
    public constructor( ...iterables:Iterable<T>[] ) {
        this.#iterables = iterables;
    }

    get iterables():readonly Iterable<T>[] {
        return this.#iterables;
    }

    *[Symbol.iterator](): Iterator<T, any, undefined> {
        const self = this;
        
        const iterables:Iterable<T>[] = [];
        const nextFunctions:(()=>IteratorResult<T,any>)[] = []

        this.#iterables.map( startIterating );

        this.#handlers.add.push( startIterating );
        this.#handlers.remove.push( stopIterating );

        yield* this.merge( nextFunctions );

        this.#handlers.add.splice( this.#handlers.add.indexOf(startIterating), 1 );
        this.#handlers.remove.splice( this.#handlers.remove.indexOf(startIterating), 1 );

        function startIterating( iterable:Iterable<T> ):boolean {
            let idx = self.iterables.reduce( (R, it, idx) => it===iterable?idx:R, -1 );
            if( idx===-1 ) {
                return false;
            }
            const iterator = iterable[Symbol.iterator]();
            function next() {
                const result = iterator.next();
                if( result.done ) {
                    stopIterating( iterable );
                }
                return result;
            };
            iterables.splice( idx, 0, iterable );
            nextFunctions.splice( idx, 0, next );
            return true;
        }

        function stopIterating( iterable:Iterable<T> ):boolean {
            let idx = iterables.reduce( (R, it, idx) => iterable===it?idx:R, -1 );
            if( idx===-1 ) {
                return false;
            }
            iterables.splice( idx, 1 );
            nextFunctions.splice( idx, 1 );
            return true;
        }

    }

    protected abstract merge( state:(()=>IteratorResult<T,any>)[] ): Iterable<T>;

    public addIterable( it:Iterable<T> ):boolean;
    public addIterable( it:Iterable<T>, idx:number ):boolean;
    public addIterable( it:Iterable<T>, idx:number=this.#iterables.length ):boolean {
        console.log( "addIterable" );

        if( isIterable( it )===false || this.#iterables.includes( it ) === true ) {
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

    public removeIterable( it:Iterable<T> ):boolean {
        console.log( "removeIterable" );
        
        if( isIterable( it )===false || this.#iterables.includes( it )===false ) {
            return false;
        }

        this.#iterables.splice( this.#iterables.indexOf( it ), 1 );
        this.#handlers.remove.forEach( f => f( it ) );
        return true;
    }
    
}

export class Equitable<T> extends Abstract<T> {
    
    protected priority:boolean = false;

    protected merge( nextFunctions:(()=>IteratorResult<T,any>)[] ): Iterable<T> {
        const priority = this.priority;
        return {
            *[Symbol.iterator]():Iterator<T, any, undefined> {
                while( nextFunctions.length ) {
                    for( const next of nextFunctions ) {
                        const {done, value} = next();
                        if( done===false ) {
                            yield value;
                            if( priority ) {
                                break;
                            }
                        }
                    }
                }
            }
        };
    }

    public static join():Iterable<any>;
    public static join( iterable:Iterable<any> ):Iterable<any>;
    public static join( ...iterables:Iterable<any>[] ):Iterable<any> {
        return new Equitable( ...iterables );
    }
}


export class Priority<T> extends Equitable<T> {
    protected priority:boolean = true;
    
    public static join():Iterable<any>;
    public static join( iterable:Iterable<any> ):Iterable<any>;
    public static join( ...iterables:Iterable<any>[] ):Iterable<any> {
        return new Priority( ...iterables );
    }
}


function isIterable( value:any ):boolean {
    return value.hasOwnProperty(Symbol.iterator);
}

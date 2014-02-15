$( document ).ready( function()
{
    var ctx = document.getElementById( 'game' ).getContext( '2d' );
    ctx.globalCompositeOperation = 'destination-over';
    
    ctx.width = $( '#game' ).attr( 'width' );
    ctx.height = $( '#game' ).attr( 'height' );
    
    var plyrState = [];
    var obsState = [];
    var numObjects = 0;
    var gameStart = true;
    var game;
    var score = 0;
    var scoreInterval;
    var highScore = 0;
    
    
    var MAX_NUM_OBS = 20;     // Change these depending on size of map
    var MAX_OBS_HEIGHT = 170; // ''
    var MIN_OBS_HEIGHT = 50;  // ''
    var OBS_WIDTH = 10;
    var OBS_START_COORD = ctx.width - OBS_WIDTH; // Starting position of obstacles
    var PLYR_POS_X_COORD = 60; // Fixed position of helicopter
    var PLYR_POS_Y_START = 50;
    var PLYR_HEIGHT = 20;
    var PLYR_WIDTH = 20;
    var PLYR_ID = 0;
    
    var OBS_NRST_TO_PLYR; // used to determine nearest obstacle to player
                          // makes it easy to calculate the next collision
                          // @value obstacle id
    
    
            
    /*=======================================================*/
    /*                     GAME FUNCTIONS                   */
    /*=====================================================*/  
    
    
        
    /*
     * Generates first frame
    */
    function init()
    {
        // Generate player
        setState( plyrState, PLYR_POS_X_COORD, PLYR_POS_Y_START, PLYR_HEIGHT, PLYR_WIDTH, 0 );
        // Generate first obstacle
        setState( obsState, ctx.width - 10, ctx.height - MAX_OBS_HEIGHT, MAX_OBS_HEIGHT, 10, numObjects );
        
        generateFrame( 1 );
    }
    
    
    init();
    
    
    /*
     * To Do
     * 
     * 1. Game speeds up as time moves on
     * 2. Acceleration and Deceleration
     * 3. Collison precision
     * 4. Use constants for setObstacles()
    */ 
            
                
    function gameLoop()
    {
        var i = 2;
            
        game = setInterval( function()
        {
            generateFrame( i );
            score++;
            i++;
        }, 10 );
        
        scoreInterval = setInterval( function()
        {
           appendScore( '#score', score );
        }, 100 );;
    }
    
    
    function resetGame()
    {
        clearInterval( scoreInterval );
        clearInterval( game );
        gameStart = true;
        
        appendScore( '#score', score );
        
        if ( score > highScore )
        {
            highScore = score;
            appendScore( '#highscore', highScore );
        }
        
        obsState = [];
        numObjects = 0;
        
        init();
    }
    
    
    function appendScore( id, score )
    {
        $( id ).html( score );
    }
    
        
    /*
     * User input functions
    */ 
    $( window ).keydown( function( e ) 
    {
        e.preventDefault();
        
        if ( gameStart === true )
        {
            score = 0;
            gameLoop();
            gameStart = false;
        }
                                
        switch( e.keyCode )
        {
            case 38:
                movePlayerUp();
                keydown = true;
                break;
        }
    });
    
    
    $( window ).keyup( function( e )
    {
        e.preventDefault();
        
        if ( e.keyCode == 38 )
        {
            keydown = false;
        }
    });
        
    
    
        
    /*=======================================================*/
    /*                 OBSTACLE FUNCTIONS                   */
    /*=====================================================*/   
    
    
    /*
     * Set obstacles randomly
     * on top or on bottom
    */ 
    function setObstacle( id )
    {
        // fetch last obstactle to prevent unfair
        // obstacle heights in next obstacle 
        var lastObs = obsState[obsState.length - 1];
        var coord_y;
        
        // Randomly decided whether to draw obstacle on top or bottom
        var top = getRandInt( 0, 20 ) % 2 === 0 ? true : false;
            
        /*
         * Height doesn't matter if next obs and last obs 
         * are in same position
        */  
        if ( ( lastObs.y === 0 && top === true )
          || ( lastObs.y !== 0 && top === false ) )
        {
            obsHeight = getRandInt( 100, MAX_OBS_HEIGHT );
        }
        else
        {
            /* 
             * get last obs height and determine  
             * what next height should be
             * numbers will have to be changed based on size of map
            */
            fairObsHeight = lastObs['h'] > 120 ? 100 : 110;
            obsHeight = getRandInt( MIN_OBS_HEIGHT, fairObsHeight );
        }

        coord_y = top ? 0 : ctx.height - obsHeight;
            
        setState( obsState, OBS_START_COORD, coord_y, obsHeight, OBS_WIDTH, id );
    }
    
    
    /*
     * Calculate speed of level
    */
    function calculateSpeed( time )
    {
        if ( time > 2000 )
        {
            return 2;
        }
        else if( time > 4000 )
        {
            return 4;
        }
        else
        {
            return 1;
        }
    } 
                
        
    /*
     * Draw Obstacles from obsState
    */ 
    function renderObstacles( speed )
    {
        for ( var a = 0; a < obsState.length; a++ )
        {
            obsState[a].x -= speed;
            draw( obsState[a].x, obsState[a].y, obsState[a].h, obsState[a].w );
            findNearestObs( a );
            setState( obsState, obsState[a].x, obsState[a].y, obsState[a].h, obsState[a].w, a );
        }
    }
    
    
    
    /*=======================================================*/
    /*                   PLAYER FUNCTIONS                   */
    /*=====================================================*/
            
    
    function movePlayerUp()
    {
        //If key is not down helicopter floats down
        // else helicopter floats up
        plyrState[PLYR_ID].y -= 4;
        coord_y = plyrState[PLYR_ID].y;
        setState( plyrState, PLYR_POS_X_COORD, coord_y, PLYR_HEIGHT, PLYR_WIDTH, 0 );
    }
    
    
    function movePlayerDown()
    {
        plyrState[PLYR_ID].y += 0.2;
        coord_y = plyrState[PLYR_ID].y;
        setState( plyrState, PLYR_POS_X_COORD, coord_y, PLYR_HEIGHT, PLYR_WIDTH, 0 );
    }
    
    
    function renderPlayer()
    {
        movePlayerDown();
        draw( plyrState[PLYR_ID].x, plyrState[PLYR_ID].y, plyrState[PLYR_ID].h, plyrState[PLYR_ID].w );
    } 
    
    
    function collisionDetection()
    {
        if ( obsState[OBS_NRST_TO_PLYR] !== undefined )
        {
            // Check to see if x coordinate is within range of player
            if (  obsState[OBS_NRST_TO_PLYR].x < plyrState[PLYR_ID].x + 10 
                 && obsState[OBS_NRST_TO_PLYR].x > plyrState[PLYR_ID].x - 1  )
            {
                    
                // Check that the y coordinate is within range of player
                if ( obsState[OBS_NRST_TO_PLYR].y === 0 )
                {
                    if ( plyrState[PLYR_ID].y >= 0 && plyrState[PLYR_ID].y <= obsState[OBS_NRST_TO_PLYR].h )
                    {
                        return true;
                    }
                }
                else
                {
                    if ( plyrState[PLYR_ID].y >= obsState[OBS_NRST_TO_PLYR].y - PLYR_HEIGHT
                         && plyrState[PLYR_ID].y <= ctx.height )
                    {
                        return true;
                    }
                }
            }
        }
        // Check that player hasn't hit boundary
        if ( plyrState[PLYR_ID].y <= 0 || plyrState[PLYR_ID].y >= ctx.height - PLYR_WIDTH )
        {
            return true;
        }
        
        return false;
    }   
    
    
    /*
     * Find the nearest obstacle so that we only have 
     * to check for collisions with one obstacle
    */ 
    function findNearestObs( id )
    {
        if ( obsState[id].x > PLYR_POS_X_COORD && obsState[id].x < PLYR_POS_X_COORD + 50 )
        {
            OBS_NRST_TO_PLYR = id;
        }
    }
    
    
    /*=======================================================*/
    /*                   CANVAS FUNCTIONS                   */
    /*=====================================================*/
    
                
    function draw( x_coord, y_coord, height, width )
    {
        ctx.fillStyle = 'rgb( 0, 0, 0 )';
        ctx.fillRect( x_coord , y_coord, width, height );
    }
    
            
    function setState( state, x_coord, y_coord, height, width, id )
    {
        state[id] = { 'x' : x_coord, 'y': y_coord, 'h' : height, 'w' : width };
    }
        
    
    function getRandInt( min, max )
    {
        return Math.floor(Math.random() * (max - min + 1) + min);
    } 
    
    
    function generateFrame( i )
    {
        ctx.clearRect( 0, 0, ctx.width, ctx.height );
        
        var speed = calculateSpeed( i );
        
        // Generate a new obstacle based on distance
        if ( i % ( 100 / speed ) === 0 )
        {
            // Check how many obstacles have been generated
            // reset index to 0 to prevent infinite size array
            if ( numObjects < MAX_NUM_OBS )
            {
                numObjects++;
            }
            else
            {
                numObjects = 0;
            }
    
            setObstacle( numObjects );
        }
    
        if ( collisionDetection() )
        {
            resetGame();
        }   
        renderPlayer();
        renderObstacles( speed );
                
        ctx.save();
    }
    
});

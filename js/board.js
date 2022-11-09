class Display {
    static hidden = new Display('hidden');
    static empty = new Display('empty');
    static number = new Display('number');
    static mine = new Display('mine');
    static flag = new Display('flag');
  
    constructor(name) {
      this.name = name;
    }
    toString() {
      return `Display.${this.name}`;
    }
}

class BoardSection extends React.Component{
    constructor(props){
        super(props);

        this.closeMenu = this.closeMenu.bind(this);
        this.openMenu = this.openMenu.bind(this);
        this.getAdjColRange = this.getAdjColumnRange.bind(this);
        this.getAdjRowRange = this.getAdjRowRange.bind(this);
        this.getNumAdjacent = this.getNumAdjacentMines.bind(this);
        this.getTileEle = this.getTileEle.bind(this);
        this.setKeyboardMode = this.setKeyboardMode.bind(this);
        this.toggleFlag = this.toggleFlag.bind(this);
        this.unhideTile = this.unhideTile.bind(this);
        this.updateBoard = this.updateBoard.bind(this);

        this.state = {
            newboard: this.newBoard.bind(this),
            board: this.newBoard(props.numRows, props.numCols, props.numMines),
            explodedTile: null,
            gameId: null,
            isKeyboardMode: null,
            menuIsOpen: false,
            menuColId: null,
            menuPos: null,
            menuRowId: null
        };
    }


    static getDerivedStateFromProps(props, state){
        // Handle reset button clicks
        if(state.gameId === null || state.gameId !== props.gameId){
            return {
                ...state,
                board: state.newboard(props.numRows, props.numCols, props.numMines),
                explodedTile: null,
                gameId: props.gameId,
                menuIsOpen: false,
                menuColId: null,
                menuPos: null,
                menuRowId: null
            }
        }

        // Handle user switching from menu mode to mouse mode partway through a game
        if(!props.isMenuMode && state.menuRowId !== null){
            return{
                ...state,
                menuColId: null,
                menuPos: null,
                menuRowId: null
            }
        }
    }


    newBoard(numRows, numCols, numMines){
        var board = [];
        const mineLocations = this.sample(numRows * numCols, numMines);

        for(var r = 0; r < numRows; r++){
            var row = [];
            for(var c = 0; c < numCols; c++){
                var tileIsMine = mineLocations.includes(r * numCols + c);
                row.push({
                    isMine: tileIsMine,
                    displayStatus: Display.hidden,
                    numAdjacentMines: null
                });
            }
            board.push(row);
        }

        return board;
    }


    sample(maxNumber, numSamples){
        var samples = [];
        while(numSamples > 0){
            let random = Math.floor(Math.random() * maxNumber);
            if (!samples.includes(random)){
                samples.push(random);
                numSamples--;
            }
        }
        return samples.sort((a, b) => {return a - b});
    }


    updateBoard(rowNum, colNum, updatedTile){
        this.setState(state => ({
            ...state,
            board: state.board.map((row, r) => row.map((item, c) => {
                if(r !== rowNum || c !== colNum) return item;
                return updatedTile;
            }))
        }))
    }


    openMenu(rowId, colId, menuX, menuY){
        this.setState((state) => { return {
            ...state,
            menuColId: colId,
            menuIsOpen: true,
            menuPos: {
                x: menuX,
                y: menuY
            },
            menuRowId: rowId
        }});
    }


    closeMenu(){
        this.setState((state) => { return {
            ...state,
            menuIsOpen: false,
            menuRowId: null,
            menuColId: null,
            menuPos: null
        }});
    }


    setKeyboardMode(isKeyboardMode){
        this.setState((state) => { return {
            ...state,
            isKeyboardMode: isKeyboardMode
        }});
    }


    getUnhiddenTile(rowNum, colNum){
        var oldTile = this.state.board[rowNum][colNum];
        
        if(oldTile.displayStatus !== Display.hidden){
            return oldTile;
        }

        if(oldTile.isMine){
            return {
                ...oldTile,
                displayStatus: Display.mine
            }
        }
        else{
            let numAdj = this.getNumAdjacentMines(rowNum, colNum);
            if(numAdj === 0){
                return {
                    ...oldTile,
                    displayStatus: Display.empty
                }
            }
            else{
                return {
                    ...oldTile,
                    displayStatus: Display.number,
                    numAdjacentMines: numAdj
                }
            }
        }
    }


    getNumAdjacentMines(rowId, colId){
        let result = 0;
        let rowRange = this.getAdjRowRange(rowId);
        let colRange = this.getAdjColRange(colId);

        for(var ri in rowRange){
            let r = rowRange[ri];

            for(var ci in colRange){
                let c = colRange[ci];
                if(!(r === rowId && c === colId)){
                    if(this.state.board[r][c].isMine){
                        result++;
                    }
                } 
            }
        }
        return result;
    }


    getAdjRowRange(rowId){
        let startRow = rowId - 1 >= 0 ? rowId - 1 : 0;
        let endRow = rowId + 1 < this.state.board.length ? rowId + 1 : this.state.board.length - 1;
        let result = [];

        for(var i = startRow; i < endRow + 1; i++){
            result.push(i);
        }

        return result;
    }


    getAdjColumnRange(colId){
        let startCol = colId - 1 >= 0 ? colId - 1 : 0;
        let endCol = colId + 1 < this.state.board[0].length ? colId + 1 : this.state.board[0].length - 1;
        let result = [];

        for(var i = startCol; i < endCol + 1; i++){
            result.push(i);
        }

        return result;
    }


    unhideTile(rowId, colId, memo = {}){
        // If this tile has already been unhidden, stop.
        if(this.state.board[rowId][colId].displayStatus !== Display.hidden){
            return;
        }

        // The check above results in a false negative when "auto-unhiding" the safe ring around an 
        // empty tile, due to React's asynchronous state updates being too slow.
        // memo keeps track of any tiles unhidden as part of an auto-unhiding, so consult that too.
        const key = `${rowId},${colId}`;
        if(key in memo){
            return;
        }
        
        // Unhide the specified tile and update memo and board accordingly
        memo[key] = 0;
        const tile = this.getUnhiddenTile(rowId, colId);
        this.updateBoard(rowId, colId, tile);
        
        // Unhiding a mine means "game over", so do the game over stuff
        if(tile.isMine){
            this.gameOverLost(rowId, colId);
            return;
        }

        // Not a mine = safe tile, so update game progress
        this.props.updateProgress();

        // Unhiding an empty tile means we know the tiles in a ring around it are also safe, so they should be "auto-unhidden".
        if(tile.displayStatus === Display.empty){
            let rowRange = this.getAdjRowRange(rowId);
            let colRange = this.getAdjColRange(colId);

            for(var ri in rowRange){
                let r = rowRange[ri];

                for(var ci in colRange){
                    let c = colRange[ci];

                    if(!(r === rowId && c === colId)){
                        this.unhideTile(r, c, memo);
                    } 
                }
            }
        }

        return;
    }


    toggleFlag(rowNum, colNum){
        const oldTile = this.state.board[rowNum][colNum];

        if(oldTile.displayStatus !== Display.flag){
            this.updateBoard(rowNum, colNum, {
                ...oldTile,
                displayStatus: Display.flag
            });
            this.props.updateFlagCounter(1);
        }
        else{
            this.updateBoard(rowNum, colNum, {
                ...oldTile,
                displayStatus: Display.hidden
            });
            this.props.updateFlagCounter(-1);
        }
    }


    gameOverLost(rowId, colId){
        this.setState((prevState) => {
            return{
                ...prevState,
                explodedTile: [rowId, colId]
            }
        })

        this.unhideAll();
        this.props.setGameOver();
    }


    unhideAll(){
        for(var r = 0; r < this.state.board.length; r++){
            for(var c = 0; c < this.state.board[0].length; c++){
                const oldTile = this.state.board[r][c];
                if(oldTile.displayStatus === Display.hidden){
                    const newTile = this.getUnhiddenTile(r, c);
                    this.updateBoard(r, c, newTile);
                }
            }
        }
    }


    getTileEle(rowId, colId){
        let tileEles = document.querySelectorAll('.tile');
        let index = (rowId * this.state.board[0].length) + colId;
        return tileEles[index];
    }


    conditionalTileMenu(displayCondition){
        if(!displayCondition){
            return null;
        }
        return(
            <TileClickMenu  board = {this.state.board}
                            closeMenu = {this.closeMenu}
                            getTileEle = {this.getTileEle}
                            isKeyboardMode = {this.state.isKeyboardMode}
                            isMenuMode = {this.props.isMenuMode}
                            menuColId = {this.state.menuColId}
                            menuIsOpen = {this.state.menuIsOpen}
                            menuPos = {this.state.menuPos}
                            menuRowId = {this.state.menuRowId}
                            toggleFlag = {this.toggleFlag}
                            unhideTile = {this.unhideTile}            
            />
        )
    }


    render(){
        return (
            <section class="panel boardContainer">
                <h2>ASSIGNED GRID</h2>
                <KeyboardMode   isKeyboardMode = {this.state.isKeyboardMode}
                                isMenuMode = {this.props.isMenuMode}
                                setKeyboardMode = {this.setKeyboardMode}
                                toggleMenuMode = {this.props.toggleMenuMode}              
                />
                { this.conditionalTileMenu(this.props.isMenuMode && this.state.menuIsOpen) }
                <Board  board = {this.state.board}
                        closeMenu = {this.closeMenu}
                        explodedTile = {this.state.explodedTile}
                        getTileEle = {this.getTileEle}
                        isGameOver = {this.props.isGameOver}
                        isMenuMode = {this.props.isMenuMode}
                        menuColId = {this.state.menuColId}
                        menuRowId = {this.state.menuRowId}
                        openMenu = {this.openMenu}
                        saveClickCoords = {this.saveClickCoords}
                        safeTilesRemaining = {this.props.safeTilesRemaining}
                        toggleFlag = {this.toggleFlag}
                        unhideTile = {this.unhideTile}           
                />
            </section>
        );
    }
}

class KeyboardMode extends React.Component{
    constructor(props){
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(){
        if(!this.props.isMenuMode){
            this.props.toggleMenuMode();
        }

        const wantKeyboardMode = !this.props.isKeyboardMode;

        this.props.setKeyboardMode(wantKeyboardMode);
        if(wantKeyboardMode){
            let myTile = document.querySelectorAll('.tile')[0];
            myTile.focus();
        }
    }

    render(){
        return(
            <button class="keyboardStartGame" onClick={this.handleClick}><span>enter game</span></button>
        ) 
    }
}


class Board extends React.Component{
    render(){
        return(
            <div id="board_id" class="board">
                {this.props.board.map((tileRow, index) => {
                return <BoardRow    key = {index}
                                    closeMenu = {this.props.closeMenu}
                                    explodedTile = {this.props.explodedTile}
                                    getTileEle = {this.props.getTileEle}
                                    isGameOver = {this.props.isGameOver}
                                    isMenuMode = {this.props.isMenuMode}
                                    maxCol = {this.props.board[0].length - 1}
                                    maxRow = {this.props.board.length - 1}
                                    menuColId = {this.props.menuColId}
                                    menuRowId = {this.props.menuRowId}
                                    openMenu = {this.props.openMenu}
                                    rowId = {index}
                                    safeTilesRemaining = {this.props.safeTilesRemaining}
                                    tileRow = {tileRow}
                                    toggleFlag = {this.props.toggleFlag}
                                    unhideTile = {this.props.unhideTile}          
                        />
                })}
            </div>
        )
    }
}



class BoardRow extends React.Component{
    render(){
        return (
            <div class="board-row">
                {this.props.tileRow.map((tile, index) => {
                    return (
                        <Tile   key = {index}
                                adjMines = {tile.numAdjacentMines}
                                colId = {index}
                                closeMenu = {this.props.closeMenu}
                                display = {tile.displayStatus.name}
                                getTileEle = {this.props.getTileEle}
                                handleClick = {this.props.handleClick}
                                isExplodedTile = {this.props.explodedTile !== null && this.props.explodedTile[0] === this.props.rowId && this.props.explodedTile[1] === index}
                                isGameOver = {this.props.isGameOver}
                                isMenuMode = {this.props.isMenuMode}
                                isMine = {tile.isMine}
                                isWon = {this.props.isGameOver && this.props.safeTilesRemaining === 0}
                                maxCol = {this.props.maxCol}
                                maxRow = {this.props.maxRow}
                                menuColId = {this.props.menuColId}
                                menuRowId = {this.props.menuRowId}
                                openMenu = {this.props.openMenu}
                                rowId = {this.props.rowId}
                                toggleFlag = {this.props.toggleFlag}
                                unhideTile = {this.props.unhideTile}      
                        />
                    )
                })}
            </div>
        )
    }
}

class Tile extends React.Component{
    constructor(props) {
        super(props);
        this.disableContextMenu = this.disableContextMenu.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
        this.hasActiveMenu = this.hasActiveMenu.bind(this);
    }

    handleMouseClick(e){
        if ("which" in e){
            var isRightMB = e.which == 3; 
        }
        else if ("button" in e){
            var isRightMB = e.button == 2; 
        }
            
        if(isRightMB){
            this.props.toggleFlag(this.props.rowId, this.props.colId);
        }
        else{
            this.props.unhideTile(this.props.rowId, this.props.colId);
        }
    }

    disableContextMenu(e){
        if(!this.props.isGameOver){
            e.preventDefault();
            this.handleClick(e);
        }
    }

    handleClick(e){
        if(!this.props.isGameOver){

            if(this.props.isMenuMode){

                // Allow touchscreen users to close the menu by tapping the tile again
                if(this.hasActiveMenu()){
                    this.props.closeMenu();
                    return;
                }

                let menuPos = this.getMenuCoords(e);
                this.props.openMenu(this.props.rowId, this.props.colId, menuPos.x, menuPos.y);

            }
            else{
                this.handleMouseClick(e);
            } 
        } 
    }

    getMenuCoords(e){
        let relativeEle = document.querySelector('.boardContainer');
        let relativeBounding = relativeEle.getBoundingClientRect();

        let relX = 0;
        let relY = 0;

        let tileEle = this.props.getTileEle(this.props.rowId, this.props.colId);
        let tileBounding = tileEle.getBoundingClientRect();
        
        if(e.clientX === undefined || e.clientX === undefined){
            // Keyboard = pretend the user clicked the bottom centre of the tile
            let tileHalfWidth = Math.round((tileBounding.right - tileBounding.left) / 2);
            relX = tileBounding.left - relativeBounding.left + tileHalfWidth;
            relY = tileBounding.bottom - relativeBounding.top;
        }
        else{
            // Touchscreen = touchscreen users close the menu by tapping the tile again.
            // If the menu appeared directly on top of the tap location, it would be possible
            // for the menu to completely block off the tile, leaving no way to close the menu.
            // Solution: offset the menu position vertically to always leave "tapping space" above.
            let spaceForClosingTap = (tileBounding.bottom - tileBounding.top) / 2.5;
            relX = e.clientX - relativeBounding.left;
            relY = e.clientY - relativeBounding.top + spaceForClosingTap;
        }

        return {
            x: this.getXPosWithMenuCentred(relX),
            y: relY
        }
    }

    getXPosWithMenuCentred(pointToCentreAround){
        const TILE_TO_MENU_WIDTH_MULTIPLIER = 1.75; // buttons are 1.25x width; padding is .25x (left and right)

        let tileEle = this.props.getTileEle(this.props.rowId, this.props.colId);
        let tileBounding = tileEle.getBoundingClientRect();

        let tileWidth = tileBounding.right - tileBounding.left;
        let expectedMenuWidth = tileWidth * TILE_TO_MENU_WIDTH_MULTIPLIER;

        return pointToCentreAround - Math.round(expectedMenuWidth / 2);
    }


    handleKeydown(e){
        // Tab and escape
        if(e.keyCode === 9 || e.keyCode === 27) {
            e.preventDefault();
            document.querySelectorAll('.keyboardStartGame')[0].focus();
        }
        // Enter and space
        else if(e.keyCode === 13 || e.keyCode === 32){
            e.preventDefault(); // Prevent the enter from also "clicking" the icon and reopening the menu
            this.handleClick(e);
        }
        // Arrows
        else if(e.keyCode === 37 || e.keyCode === 38 || e.keyCode === 39 || e.keyCode === 40){
            e.preventDefault(); // Prevent the website from scrolling distractingly in the background
            
            let targetRow = this.props.rowId;
            let targetCol = this.props.colId;

            // Up arrow
            if(e.keyCode === 38) {  
                targetRow--;
                if(targetRow < 0){
                    targetRow = this.props.maxRow;
                }
            }
            // Down arrow
            else if(e.keyCode === 40) {
                targetRow++;
                if(targetRow > this.props.maxRow){
                    targetRow = 0;
                }
            }
            // Left arrow
            else if(e.keyCode === 37){
                targetCol--;
                if(targetCol < 0){
                    targetCol = this.props.maxCol;
                }
            }
            // Right arrow
            else if(e.keyCode === 39){
                targetCol++;
                if(targetCol > this.props.maxCol){
                    targetCol = 0;
                }
            }

            let activeTile = this.props.getTileEle(targetRow, targetCol);
            activeTile.focus();  
        }
    }


    // When the game is won, display a flag on any remaining hidden tiles, so the board looks complete.
    // Otherwise, as per the tile's "display" state.
    getCssClassMain(){
        const wantAutoFlag = this.props.isWon && this.props.display === Display.hidden.name;
        return wantAutoFlag ? Display.flag.name : this.props.display;
    }

    // When the game is lost, show the player which flags were incorrect
    getCssClassFlag(){
        const isFlagWrong = this.props.display === Display.flag.name && !this.props.isMine;
        return this.props.isGameOver && isFlagWrong ? ' wrong' : '';
    }

    // When the game is lost, highlight the mine which caused the loss
    getCssClassExploded(){
        return this.props.isExplodedTile ? ' exploded' : '';
    }

    // Show which tile is focussed (primarily for keyboard users)
    getCssClassMenuActive(){
        return this.hasActiveMenu() ? ' menuActive' : '';
    }

    hasActiveMenu(){
        return  this.props.menuColId === this.props.colId && this.props.menuRowId === this.props.rowId;
    }

    getConditionalCssClasses(){
        const cssClasses = [
            this.getCssClassMain(),
            this.getCssClassFlag(),
            this.getCssClassExploded(),
            this.getCssClassMenuActive()
        ];
        return cssClasses.join('');
    }

    conditionalTileNumber(displayCondition){
        if(!displayCondition){
            return null;
        }
        return (
            <TileNumberUI   number = {this.props.adjMines}
            />
        )
    }

    render(){
        const conditionalCssClasses = this.getConditionalCssClasses();
        const TAB_INDEX = -1;
        return (
            <div class={'tile ' + conditionalCssClasses} tabindex={TAB_INDEX} onClick={this.handleClick} onContextMenu={this.disableContextMenu} onKeyDown={this.handleKeydown}>
                { this.conditionalTileNumber(this.props.display === Display.number.name) }
            </div>
        );
    }
}

class TileNumberUI extends React.Component{
    render(){
        return (
            <span class={`adj${this.props.number}`}>
                {this.props.number}
            </span>
        );
    }
}

class TileClickMenu extends React.Component{
    constructor(props){
        super(props);
        this.activeTileIsFlagged = this.activeTileIsFlagged.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.toggleFlag = this.toggleFlag.bind(this);
        this.unhideTile = this.unhideTile.bind(this);
        
        this.state = {
            selectedId: 0
        }
    }


    setSelected(selectedId){
        this.setState((state) => { return {
            ...state,
            selectedId: selectedId
        }});
    }


    toggleFlag(){
        this.props.toggleFlag(this.props.menuRowId, this.props.menuColId);
        this.closeMenu();
    }


    unhideTile(){
        this.props.unhideTile(this.props.menuRowId, this.props.menuColId);
        this.closeMenu();
    }


    closeMenu(){
        let activeTileEle = this.props.getTileEle(this.props.menuRowId, this.props.menuColId);
        activeTileEle.focus();
        this.props.closeMenu();
    }


    getActiveTile(rowId, colId, board){
        if(rowId === null || colId === null){
            return null;
        }
        return board[rowId][colId];
    }


    activeTileIsFlagged(){
        const activeTile = this.getActiveTile(this.props.menuRowId, this.props.menuColId, this.props.board);
        if(activeTile===null){
            return null;
        }
        return activeTile.displayStatus === Display.flag;
    }


    getPositioningStyle(){
        return {
            top: this.props.menuPos.y + 'px',
            left: this.props.menuPos.x + 'px'
        };
    }

    
    handleKeyDown(e){
        // Tab and escape
        if(e.keyCode === 9 || e.keyCode === 27) {
            e.preventDefault();
            this.closeMenu();
        }
        // Up/down arrows
        else if(e.keyCode === 38 || e.keyCode === 40){
            e.preventDefault(); // Prevent the website from scrolling distractingly in the background

            let targetId = this.state.selectedId;
            let buttons = document.querySelectorAll('.menu')[0].getElementsByTagName('button');
            let maxId = buttons.length - 1;

            // Up arrow
            if(e.keyCode === 38) {  
                targetId--;
                if(targetId < 0){
                    targetId = maxId;
                }
            }
            // Down arrow
            else if(e.keyCode === 40) {
                targetId++;
                if(targetId > maxId){
                    targetId = 0;
                }
            }
            this.setSelected(targetId);
            buttons[targetId].focus();
        }
    }

    render(){
        const isFlagged = this.activeTileIsFlagged();
        const flaggedMode = isFlagged !== null && isFlagged ? "unflag" : "addflag";
        return(
            <div class="overlayWrapper menu" style={this.getPositioningStyle()}>
                <section class="tileMenu" onKeyDown={this.handleKeyDown}>
                    <button autoFocus class="tileMenuBtn btn unhideTile" onClick={this.unhideTile}></button>
                    <button class={"tileMenuBtn btn " + flaggedMode} onClick={this.toggleFlag}></button>
                </section>
            </div>
        )
    }
}


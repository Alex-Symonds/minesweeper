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
        this.toggleFlag = this.toggleFlag.bind(this);
        this.unhideTile = this.unhideTile.bind(this);
        this.updateBoard = this.updateBoard.bind(this);

        this.state = {
            newboard: this.newBoard.bind(this),
            board: this.newBoard(props.numRows, props.numCols, props.numMines),
            explodedTile: null,
            gameId: null,
            isActive: true,
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
                isActive: true,
                menuIsOpen: false,
                menuColId: null,
                menuPos: null,
                menuRowId: null
            }
        }

        // Handle user switching from touch/keyboard to mouse mode partway through a game
        if(!props.isMenuMode && state.menuRowId !== null){
            return{
                ...state,
                menuColId: null,
                menuPos: null,
                menuRowId: null
            }
        }

        return null;
    }

    componentDidMount(){
        if(this.state.isActive && this.props.isGameOver && this.props.safeTilesRemaining === 0){
            this.gameOverWon();
        }
    }

    componentDidUpdate(){
        if(this.state.isActive && this.props.isGameOver && this.props.safeTilesRemaining === 0){
            this.gameOverWon();
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

    gameOverWon(){
        this.autoFlagMines();
        this.setState((prevState) => {
            return{
                ...prevState,
                isActive: false
            }
        });
    }

    autoFlagMines(){
        for(var r = 0; r < this.state.board.length; r++){
            for(var c = 0; c < this.state.board[0].length; c++){
                const tile = this.state.board[r][c];
                if(tile.displayStatus === Display.hidden && tile.isMine){
                    this.toggleFlag(r, c);
                }
            }
        }
    }

    gameOverLost(rowId, colId){
        this.setState((prevState) => {
            return{
                ...prevState,
                explodedTile: [rowId, colId],
                isActive: false
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





    render(){
        return (
            <section className="panel boardContainer">
                <h2>ASSIGNED GRID</h2>
                <ProgressUI flagCount = {this.props.flagCount}
                            safeTilesRemaining = {this.props.safeTilesRemaining}
                            totalMines = {this.props.totalMines}
                />
                { this.props.isMenuMode && this.state.menuIsOpen &&

                    <TileClickMenu  board = {this.state.board}
                        closeMenu = {this.closeMenu}
                        getTileEle = {this.getTileEle}
                        isKeyboardMode = {this.props.isKeyboardMode}
                        isMenuMode = {this.props.isMenuMode}
                        menuColId = {this.state.menuColId}
                        menuIsOpen = {this.state.menuIsOpen}
                        menuPos = {this.state.menuPos}
                        menuRowId = {this.state.menuRowId}
                        toggleFlag = {this.toggleFlag}
                        unhideTile = {this.unhideTile}            
                    />

                }
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


class ProgressUI extends React.Component{
    render(){
        const tooManyFlags = this.props.flagCount > this.props.totalMines;
        const cssClassError = tooManyFlags ? ' error' : '';

        return (
            <section className="progress">
                <p><span className="label">mines (flagged/total)</span><span className={'value' + cssClassError}>{this.props.flagCount}/{this.props.totalMines}</span></p>
                <p><span className="label">safe tiles remaining</span><span className="value">{this.props.safeTilesRemaining}</span></p>
            </section>
        );
    }
}


class Board extends React.Component{
    render(){
        return(
            <div id="board_id" className="board">
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
            <div className="board-row">
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
        const TILE_TO_MENU_WIDTH_MULTIPLIER = 1.75; // buttons are 1.25x width; padding is .5x (.25x each for left and right)

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
            document.getElementById('reset_btn_id').focus();
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
        return this.props.isMenuMode && this.hasActiveMenu() ? ' menuActive' : '';
    }

    getCssNumberSpecific(){
        return this.props.display === Display.number.name ? ` adj${this.props.adjMines}` : '';
    }

    hasActiveMenu(){
        return  this.props.menuColId === this.props.colId && this.props.menuRowId === this.props.rowId;
    }

    getConditionalCssClasses(){
        const cssClasses = [
            this.props.display,
            this.getCssClassFlag(),
            this.getCssClassExploded(),
            this.getCssClassMenuActive(),
            this.getCssNumberSpecific()
        ];
        return cssClasses.join('');
    }

    render(){
        const conditionalCssClasses = this.getConditionalCssClasses();
        const TAB_INDEX = -1;
        return (
            <div className={'tile ' + conditionalCssClasses} tabIndex={TAB_INDEX} onClick={this.handleClick} onContextMenu={this.disableContextMenu} onKeyDown={this.handleKeydown}>
                { this.props.display === Display.number.name &&
                    <TileNumberUI   number = {this.props.adjMines}/>
                }
            </div>
        );
    }
}

class TileNumberUI extends React.Component{
    render(){
        return (
            <span>
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
            <div className="overlayWrapper menu" style={this.getPositioningStyle()}>
                <section className="tileMenu" onKeyDown={this.handleKeyDown}>
                    <button autoFocus className="tileMenuBtn unhideTile" onClick={this.unhideTile}></button>
                    <button className={"tileMenuBtn " + flaggedMode} onClick={this.toggleFlag}></button>
                </section>
            </div>
        )
    }
}


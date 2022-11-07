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

        this.updateBoard = this.updateBoard.bind(this);
        this.getAdjRowRange = this.getAdjRowRange.bind(this);
        this.getAdjColRange = this.getAdjColumnRange.bind(this);
        this.getNumAdjacent = this.getNumAdjacentMines.bind(this);
        this.unhideTile = this.unhideTile.bind(this);
        this.toggleFlag = this.toggleFlag.bind(this);
        this.openMenu = this.openMenu.bind(this);
        this.closeMenu = this.closeMenu.bind(this);

        this.state = {
            newboard: this.newBoard.bind(this),
            gameId: null,
            board: this.newBoard(props.numRows, props.numCols, props.numMines),
            explodedTile: null,
            menuIsOpen: false,
            menuRowId: null,
            menuColId: null,
            menuPos: null
        };
    }


    static getDerivedStateFromProps(props, state){
        if(state.gameId === null || state.gameId !== props.gameId){
            return {
                ...state,
                gameId: props.gameId,
                board: state.newboard(props.numRows, props.numCols, props.numMines),
                explodedTile: null,
                menuPos: null
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
            menuIsOpen: true,
            menuRowId: rowId,
            menuColId: colId,
            menuPos: {
                x: menuX,
                y: menuY
            }
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
        if(oldTile.displayStatus !== Display.hidden) return oldTile;

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

        // The above results in a false negative when "auto-unhiding" the safe ring around an empty tile,
        // due to React's asynchronous state updates being too slow.
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
        else if(oldTile.displayStatus === Display.flag){
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

    render(){
        return (
            <section class="panel boardContainer">
                <h2>ASSIGNED GRID</h2>
                <KeyboardMode   isMenuMode = {this.props.isMenuMode}
                                toggleMenuMode = {this.props.toggleMenuMode}
                />
                <TileClickMenu  isMenuMode = {this.props.isMenuMode}
                                menuIsOpen = {this.state.menuIsOpen}
                                closeMenu = {this.closeMenu}
                                board = {this.state.board}
                                menuRowId = {this.state.menuRowId}
                                menuColId = {this.state.menuColId}
                                unhideTile = {this.unhideTile}
                                toggleFlag = {this.toggleFlag}
                                menuPos = {this.state.menuPos}
                />
                <Board    board = {this.state.board}
                            toggleFlag = {this.toggleFlag}
                            unhideTile = {this.unhideTile}
                            explodedTile = {this.state.explodedTile}
                            isGameOver = {this.props.isGameOver}
                            safeTilesRemaining = {this.props.safeTilesRemaining}
                            openMenu = {this.openMenu}
                            isMenuMode = {this.props.isMenuMode}
                            saveClickCoords = {this.saveClickCoords}
                            menuRowId = {this.state.menuRowId}
                            menuColId = {this.state.menuColId}
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

        document.querySelectorAll('.tile')[0].focus();
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
                                    rowNum = {index}
                                    tileRow = {tileRow}
                                    toggleFlag = {this.props.toggleFlag}
                                    unhideTile = {this.props.unhideTile}
                                    explodedTile = {this.props.explodedTile}
                                    isGameOver = {this.props.isGameOver}
                                    safeTilesRemaining = {this.props.safeTilesRemaining}
                                    openMenu = {this.props.openMenu}
                                    isMenuMode = {this.props.isMenuMode}
                                    menuRowId = {this.props.menuRowId}
                                    menuColId = {this.props.menuColId}
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
                                colNum = {index}
                                rowNum = {this.props.rowNum}
                                handleClick = {this.props.handleClick}
                                display = {tile.displayStatus.name}
                                adjMines = {tile.numAdjacentMines}
                                isExplodedTile = {this.props.explodedTile !== null && this.props.explodedTile[0] === this.props.rowNum && this.props.explodedTile[1] === index}
                                isGameOver = {this.props.isGameOver}
                                isMine = {tile.isMine}
                                isWon = {this.props.isGameOver && this.props.safeTilesRemaining === 0}
                                isMenuMode = {this.props.isMenuMode}
                                openMenu = {this.props.openMenu}
                                toggleFlag = {this.props.toggleFlag}
                                unhideTile = {this.props.unhideTile}
                                menuRowId = {this.props.menuRowId}
                                menuColId = {this.props.menuColId}
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
        this.handleClick = this.handleClick.bind(this);
        this.disableContextMenu = this.disableContextMenu.bind(this);
    }

    handleMouseClick(e){
        if ("which" in e){
            var isRightMB = e.which == 3; 
        }
        else if ("button" in e){
            var isRightMB = e.button == 2; 
        }
            
        if(isRightMB){
            this.props.toggleFlag(this.props.rowNum, this.props.colNum);
        }
        else{
            this.props.unhideTile(this.props.rowNum, this.props.colNum);
        }
    }

    handleClick(e){
        if(!this.props.isGameOver){
            if(this.props.isMenuMode){
                let ele = document.getElementById('board_id');
                let eleArea = ele.getBoundingClientRect();

                let x = this.getMenuPosX(e, eleArea);
                let y = this.getMenuPosY(e, eleArea);
                this.props.openMenu(this.props.rowNum, this.props.colNum, x, y);
            }
            else{
                this.handleMouseClick(e);
            } 
        } 
    }

    getMenuPosX(e, eleArea){
        // Set a cap on the value of X to ensure the entire menu fits on screen
        const OFFSET_X = 8;
        let clickX = e.clientX - eleArea.left;
        let maxX = (eleArea.right - eleArea.left) / 2;
        return clickX > maxX ? maxX + OFFSET_X : clickX + OFFSET_X;
    }

    getMenuPosY(e, eleArea){
        // Add an offset to Y so the menu appears partway down the tile
        const OFFSET_Y = 32;
        return e.clientY - eleArea.top + OFFSET_Y;
    }

    disableContextMenu(e){
        if(!this.props.isGameOver){
            e.preventDefault();
            this.handleClick(e);
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

    getCssClassMenuActive(){
        const isActive = this.props.menuColId === this.props.colNum && this.props.menuRowId === this.props.rowNum;
        return isActive ? ' menuActive' : '';
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

    render(){
        const conditionalCssClasses = this.getConditionalCssClasses();
        return (
            <div class={'tile ' + conditionalCssClasses} onClick={this.handleClick} onContextMenu={this.disableContextMenu}>
                <TileNumberUI   isNumber = {this.props.display === Display.number.name}
                                number = {this.props.adjMines}
                                />
            </div>
        );
    }
}

class TileNumberUI extends React.Component{
    render(){
        if(!this.props.isNumber){
            return null;
        }

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
        this.toggleFlag = this.toggleFlag.bind(this);
        this.unhideTile = this.unhideTile.bind(this);
        this.activeTileIsFlagged = this.activeTileIsFlagged.bind(this);
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

    toggleFlag(){
        this.props.toggleFlag(this.props.menuRowId, this.props.menuColId);
        this.props.closeMenu();
    }

    unhideTile(){
        this.props.unhideTile(this.props.menuRowId, this.props.menuColId);
        this.props.closeMenu();
    }

    getPositioningStyle(){
        return {
            top: this.props.menuPos.y + 'px',
            left: this.props.menuPos.x + 'px'
        };
    }

    render(){
        if(!this.props.isMenuMode || !this.props.menuIsOpen){
            return null;
        }

        const isFlagged = this.activeTileIsFlagged();
        const flaggedDisplayText = isFlagged !== null && isFlagged ? "unflag" : "flag";
        return(
            <section class="menu panel" style={this.getPositioningStyle()}>
                <h2>ACTION</h2>
                <button class="unhideTile btn" onClick={this.unhideTile}>uncover</button>
                <button class="toggleFlag btn" onClick={this.toggleFlag}>{flaggedDisplayText}</button>
                <button class="close" onClick={this.props.closeMenu}>X</button>
            </section>
        )
    }
}


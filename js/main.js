class MinesweeperGame extends React.Component{
    constructor(props){
        super(props);
        this.updateProgress = this.updateProgress.bind(this);
        this.setGameOver = this.setGameOver.bind(this);
        this.updateFlagCounter = this.updateFlagCounter.bind(this);
        this.reset = this.reset.bind(this);
        this.toggleMenuMode = this.toggleMenuMode.bind(this);

        this.state = {
            gameId: 1,
            gameOver: false,
            flagCounter: 0,
            isMenuMode: false,
            maxSafeTiles: props.numRows * props.numCols - props.numMines,
            safeTilesRemaining: props.numRows * props.numCols - props.numMines
        }
    }

    reset(){
        this.setState((state) => { 
            return { 
                ...state,
                gameId: state.gameId + 1,
                gameOver: false,
                flagCounter: 0,
                safeTilesRemaining: state.maxSafeTiles 
            }})

        let tile = document.querySelectorAll('.tile')[0];
        tile.focus();
    }

    updateProgress(){
        if(this.state.safeTilesRemaining === 1){
            this.setGameOver();
        }
        this.updateSafeTiles(-1);
    }

    setGameOver(){
        this.setState((state) => { return { ...state, gameOver: true }})
    }

    updateSafeTiles(change){
        this.setState((state) => { return { ...state, safeTilesRemaining: state.safeTilesRemaining + change }})
    }

    updateFlagCounter(change){
        this.setState((state) => { return { ...state, flagCounter: state.flagCounter + change } })
    }

    toggleMenuMode(){
        this.setState((state) => {return { ...state, isMenuMode: !state.isMenuMode}});
    }
    
    render(){
        return (
            <div class="minesweeper">
                <h1>MINESWEEPER</h1>
                <StatusUI   flagCount = {this.state.flagCounter}
                            isMenuMode = {this.state.isMenuMode}
                            reset = {this.reset}
                            safeTilesRemaining = {this.state.safeTilesRemaining}
                            toggleMenuMode = {this.toggleMenuMode}
                            totalMines = {this.props.numMines}       
                />
                <BoardSection   gameId = {this.state.gameId}
                                isMenuMode = {this.state.isMenuMode}
                                isGameOver = {this.state.gameOver}
                                numCols = {this.props.numCols}
                                numMines = {this.props.numMines}
                                numRows = {this.props.numRows}
                                safeTilesRemaining = {this.state.safeTilesRemaining}
                                setGameOver = {this.setGameOver}
                                toggleMenuMode = {this.toggleMenuMode}
                                updateFlagCounter = {this.updateFlagCounter}
                                updateProgress = {this.updateProgress}              
                />
                <Result     gameId = {this.state.gameId}   
                            isGameOver = {this.state.gameOver}
                            safeTilesRemaining = {this.state.safeTilesRemaining}        
                />
            </div>
        );
    }
}

class Result extends React.Component{
    constructor(props){
        super(props);
        this.handleOverlayClose = this.handleOverlayClose.bind(this);

        this.state = {
            gameId: null,
            wantOverlay: true
        };
    }

    static getDerivedStateFromProps(props, state){
        if(state.gameId === null || state.gameId !== props.gameId){
            return {
                ...state,
                wantOverlay: true,
                gameId: props.gameId
            }
        }
    }

    removeOverlay(){
        this.setState((state) => { return {
            ...state,
            wantOverlay: false
        }});
    }

    handleOverlayClose(){
        // Move focus to reset button so keyboard users can play again easily
        document.getElementById('reset_btn_id').focus();
        this.removeOverlay();
    }

    closeOverlayButton(){
        return (
            <button autoFocus class="close" onClick={this.handleOverlayClose}>{String.fromCharCode(8211)}</button>
        )
    }

    getOverlayPositionStyle(){
        if(!this.state.wantOverlay){
            return null;
        }

        // Position the overlay across the board. Vertically centered would be 
        // nice, but then we'd need to take the height of the message into
        // account when it won't've been rendered yet and BLEH.
        // = Go with 25% from the top of the board and hope nobody writes a novel 
        // for the victory/loss messages.

        let boardEle = document.getElementById('board_id');
        let bounding = boardEle.getBoundingClientRect();
        let pos = bounding.top + Math.round((bounding.bottom - bounding.top) / 4);

        return {
            top: pos + "px"
        };
    }

    render(){
        if(!this.props.isGameOver) return null;
        const won = this.props.safeTilesRemaining === 0;

        if(this.state.wantOverlay){
            return (
                <div class="overlayWrapper message" style={this.getOverlayPositionStyle()}>
                    <ResultPanelUI  closeOverlayButton = {this.closeOverlayButton()}
                                    won = {won}
                    />
                </div>
            )
        }
        return <ResultPanelUI   closeOverlayButton = {null}
                                won = {won}
                />
    }
}

class ResultPanelUI extends React.Component{
    render(){
        const status = this.props.won ? "success" : "failure";
        const message = this.props.won ? 
                "lives saved: incalculable. congratulations++" : 
                "explosions chaining. all hope lost. goodb-";

        return(
            <section class="panel result">
                <h2>MISSION RESULT</h2>
                {this.props.closeOverlayButton}
                <h3>{status.toUpperCase()}</h3>
                <p>{message}</p>
            </section>
        );
    }
}

ReactDOM.render(<MinesweeperGame numRows={10} numCols={10} numMines={10} />, document.querySelector(".root"));
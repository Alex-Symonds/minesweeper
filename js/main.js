const DARK = 'dark-theme';
const LIGHT = 'light-theme';

class InputMode {
    static mouse = new InputMode('mouse');
    static keyboard = new InputMode('keyboard');
    static touch = new InputMode('touch');
  
    constructor(name) {
      this.name = name;
    }
    toString() {
      return `InputMode.${this.name}`;
    }
}

class MinesweeperGame extends React.Component{
    constructor(props){
        super(props);
        this.updateProgress = this.updateProgress.bind(this);
        this.setGameOver = this.setGameOver.bind(this);
        this.updateFlagCounter = this.updateFlagCounter.bind(this);
        this.reset = this.reset.bind(this);
        this.setTheme = this.setTheme.bind(this);
        this.setInputMode = this.setInputMode.bind(this);

        this.state = {
            flagCounter: 0,
            gameId: 1,
            gameOver: false,
            isMenuMode: false,
            inputMode: InputMode.mouse,
            maxSafeTiles: props.numRows * props.numCols - props.numMines,
            safeTilesRemaining: props.numRows * props.numCols - props.numMines,
            theme: window.matchMedia("(prefers-color-scheme: dark)") ? DARK : LIGHT
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
        if(this.state.safeTilesRemaining <= 0){
            return;
        }

        if(this.state.safeTilesRemaining === 1){
            this.setGameWon();
            return;
        }

        this.updateSafeTiles(-1);
    }

    setGameWon(){
        this.setState((state) => { return { ...state, gameOver: true,  safeTilesRemaining: 0}})
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

    setTheme(newTheme){
        this.setState((state) => { return { ...state, theme: newTheme }});
    }

    setInputMode(selectedInputMode){
        this.setState((state) => {return { ...state, inputMode: selectedInputMode}});
    }

    render(){
        const isMenuMode = this.state.inputMode === InputMode.touch || this.state.inputMode === InputMode.keyboard;

        return (
            <div className={"app-body " + this.state.theme}>
                <div className="minesweeper">
                    <h1>MINESWEEPER</h1>
                    <Controls   isMenuMode = {isMenuMode}
                                reset = {this.reset}
                                setTheme = {this.setTheme}
                                theme = {this.state.theme}
                                setInputMode = {this.setInputMode}
                                inputMode = {this.state.inputMode}
                    />
                    <BoardSection   flagCount = {this.state.flagCounter}
                                    gameId = {this.state.gameId}
                                    isMenuMode = {isMenuMode}
                                    isGameOver = {this.state.gameOver}
                                    numCols = {this.props.numCols}
                                    numMines = {this.props.numMines}
                                    numRows = {this.props.numRows}
                                    safeTilesRemaining = {this.state.safeTilesRemaining}
                                    setGameOver = {this.setGameOver}
                                    totalMines = {this.props.numMines} 
                                    updateFlagCounter = {this.updateFlagCounter}
                                    updateProgress = {this.updateProgress}                      
                    />
                    <Result     gameId = {this.state.gameId}   
                                isGameOver = {this.state.gameOver}
                                safeTilesRemaining = {this.state.safeTilesRemaining}        
                    />
                </div>
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
        return null;
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

    render(){
        if(!this.props.isGameOver) return null;
        const won = this.props.safeTilesRemaining === 0;
        const cssClass = "result";

        if(this.state.wantOverlay){
            return (
                <PanelOverlayWrapper    handleOverlayClose = {this.handleOverlayClose}
                                        cssClass = {cssClass} >
                    <ResultContents won = {won} />
                </PanelOverlayWrapper>
            )
        }
        return (
            <section className={"panel " + cssClass}>
                <ResultContents won = {won} />
            </section>
        )
    }
}


class ResultContents extends React.Component{
    render(){
        const status = this.props.won ? "Success" : "Failure";
        const message = this.props.won ? 
                "Lives saved: incalculable. Congratulations++" : 
                "Explosions chaining. All hope lost. Goodb-";

        return(
            <>
                <h2>MISSION RESULT</h2>
                <h3>{status.toUpperCase()}</h3>
                <p>{message.toLowerCase()}</p>
            </>
        );
    }
}


class PanelOverlayWrapper extends React.Component{
    constructor(props){
        super(props);
        this.getOverlayPositionStyle = this.getOverlayPositionStyle.bind(this);
    }

    getOverlayPositionStyle(){
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
        return(
            <div className="overlayWrapper message" style={this.getOverlayPositionStyle()}>
                <section className={this.props.cssClass === null ? "panel" : "panel " + this.props.cssClass}>
                    <button autoFocus className="close" onClick={this.props.handleOverlayClose}>{String.fromCharCode(8211)}</button>
                    { this.props.children }
                </section>
            </div>
        );
    }
}





const root = ReactDOM.createRoot(
    document.getElementById('root')
);
root.render(<MinesweeperGame numRows={10} numCols={10} numMines={10} />);
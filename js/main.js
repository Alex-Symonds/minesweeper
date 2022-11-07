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
                <Status totalMines = {this.props.numMines}
                        flagCount = {this.state.flagCounter}
                        safeTilesRemaining = {this.state.safeTilesRemaining}
                        reset = {this.reset}
                        isMenuMode = {this.state.isMenuMode}
                        toggleMenuMode = {this.toggleMenuMode}
                />
                <BoardSection numRows = {this.props.numRows}
                                numCols = {this.props.numCols}
                                numMines = {this.props.numMines}
                                gameId = {this.state.gameId}
                                updateProgress = {this.updateProgress}
                                updateFlagCounter = {this.updateFlagCounter}
                                setGameOver = {this.setGameOver}
                                isGameOver = {this.state.gameOver}
                                safeTilesRemaining = {this.state.safeTilesRemaining}
                                isMenuMode = {this.state.isMenuMode}
                                toggleMenuMode = {this.toggleMenuMode}
                />
                <ResultUI   safeTilesRemaining = {this.state.safeTilesRemaining}
                            isGameOver = {this.state.gameOver} 
                />
            </div>
        );
    }
}

class ResultUI extends React.Component{
    render(){
        if(!this.props.isGameOver) return null;

        const won = this.props.safeTilesRemaining === 0;
        const resultClass = won ? "win" : "loss";
        const status = won ? "success" : "failure";
        const message = won ? "lives saved: incalculable. congratulations++" : "explosions chaining. all hope lost. goodb-"
        
        return(
            <section class={'panel result ' + resultClass}>
                <h2>MISSION RESULT</h2>
                <h3>{status.toUpperCase()}</h3>
                <p>{message}</p>
            </section>
        );
    }
}

ReactDOM.render(<MinesweeperGame numRows={10} numCols={10} numMines={10} />, document.querySelector(".root"));
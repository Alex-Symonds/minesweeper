class StatusUI extends React.Component{
    render(){
        return(
            <section class="panel statusControls">
                <h2>MISSION STATUS</h2>
                <ProgressUI flagCount = {this.props.flagCount}
                            safeTilesRemaining = {this.props.safeTilesRemaining}
                            totalMines = {this.props.totalMines}
                />
                <section class="controls">
                    <MenuToggleUI   isMenuMode = {this.props.isMenuMode}
                                    toggleMenuMode = {this.props.toggleMenuMode}     
                    />
                    <ResetGameUI reset={this.props.reset}
                    />
                </section>
            </section>
        )
    }
}

class ProgressUI extends React.Component{
    render(){
        const tooManyFlags = this.props.flagCount > this.props.totalMines;
        const cssClassError = tooManyFlags ? ' error' : '';

        return (
            <section class="progress">
                <p><span class="label">mines (flagged/total)</span><span class={"value" + cssClassError}>{this.props.flagCount}/{this.props.totalMines}</span></p>
                <p><span class="label">safe tiles remaining</span><span class="value">{this.props.safeTilesRemaining}</span></p>
            </section>
        );
    }
}

class MenuToggleUI extends React.Component{
    render(){
        return (
            <div class="labelledToggle">
                <label>input mode</label>
                <button class="toggle" onClick={this.props.toggleMenuMode}>
                    <ToggleOptionUI displayText = 'mouse'
                                    isActive = {!this.props.isMenuMode}
                                    />
                    <ToggleOptionUI displayText = 'menu'
                                    isActive = {this.props.isMenuMode}
                                    />
                </button>
            </div>
        );
    }
}

class ToggleOptionUI extends React.Component{
    render(){
        const cssActiveOption = 'toggleActive';
        const cssInactiveOption = 'toggleInactive';
        return(
            <span class={this.props.isActive ? cssActiveOption : cssInactiveOption}>{this.props.displayText}</span>
        )
    }
}

class ResetGameUI extends React.Component{
    render(){
        return(
            <button class="btn" id="reset_btn_id" onClick={this.props.reset}>
                reset
            </button>
        )
    }
}
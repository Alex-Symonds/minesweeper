## Project goals
- Frontend-only project, so I could focus on React
- Practice supporting keyboard and touch operation, in addition to mouse

## How to navigate this project
- Example class component: [code](https://github.com/Alex-Symonds/minesweeper-dev/blob/a853bd4440397eb7d623415d84f89b5c5a5700b0/js/board.js#L16)
- Memo object used to provide a synchronous base case for the recursive unhideTile function: [code](https://github.com/Alex-Symonds/minesweeper-dev/blob/a853bd4440397eb7d623415d84f89b5c5a5700b0/js/board.js#L238)
- Dark/light mode switch: [code](https://github.com/Alex-Symonds/minesweeper-dev/blob/a853bd4440397eb7d623415d84f89b5c5a5700b0/js/controls.js#L89)
- Tried out native CSS variables instead of SCSS: [code](https://github.com/Alex-Symonds/minesweeper-dev/blob/a853bd4440397eb7d623415d84f89b5c5a5700b0/scss/styles.scss#L48)

## Why I built it this way
- I wanted to get some experience using React with class components, so I won't be completely mystified when confronted by older codebases
- I skipped some accessibility measures targetted at screenreaders -- such as button labels and text-based tile contents -- because minesweeper is a visual game which wouldn't be fun to play over audio

## If I had time
- Investigate the possibility of adapting minesweeper for play via screenreader. I suspect that the best case outcome would be a game where it's *possible* to complete it via screenreader, but it's a right slog and not much fun. Still, looking into it would improve my knowledge of accessibility techniques, while there's also the exciting possibility that I'm wrong: then I could create a version of minesweeper which more people can enjoy
- Improve keyboard operation. It belatedly occurred to me that there is currently no utility in being able to move the 'cursor' to empty or numbered tiles. Limiting movement to hidden and flagged tiles might improve the keyboard experience
- Better organisation of the CSS colour variables. While working on light mode, I kept finding that I'd used the same variable for two elements which happened to share the same colour in dark mode, but didn't necessarily *need* to be the same colour as each other: a sure sign that I should've chosen different variables in the first place
- Design improvements
    - With mouse: the appearance of the dark/light mode toggle confuses *me* and I made it that way
    - With keyboard in dark mode: adjust the formatting on the pop-up menu's buttons to make it clearer which is currently selected
    - Light mode is... well, I don't think it would surprise anyone to learn that dark mode came first
    - Wider screens have acres of empty space at the sides. Might be nice to add some decorative elements there, or perhaps move the controls to the side

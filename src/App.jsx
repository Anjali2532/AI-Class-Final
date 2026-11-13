import { useState } from 'react'
import './App.css'

const ROWS = 12
const COLUMNS = 20
const DEFAULT_START = { row: 5, column: 3 }
const DEFAULT_GOAL = { row: 5, column: 16 }

// Convert a row and column into a stable cell key.
function cellKey(row, column) {
  return `${row}-${column}`
}

// Return the walkable neighbors around one cell.
function getNeighbors(cell, walls) {
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]
  return directions
    .map(([rowOffset, columnOffset]) => ({ row: cell.row + rowOffset, column: cell.column + columnOffset }))
    .filter((neighbor) => neighbor.row >= 0 && neighbor.row < ROWS && neighbor.column >= 0 && neighbor.column < COLUMNS && !walls.has(cellKey(neighbor.row, neighbor.column)))
}

// Rebuild the path by following parent links from the goal.
function buildPath(parents, start, goal) {
  const path = []
  let current = goal
  while (current) {
    path.unshift(current)
    if (cellKey(current.row, current.column) === cellKey(start.row, start.column)) return path
    current = parents.get(cellKey(current.row, current.column))
  }
  return []
}

// Explore the grid in layers and return the shortest unweighted path.
function breadthFirstSearch(start, goal, walls) {
  const queue = [start]
  const visited = new Set([cellKey(start.row, start.column)])
  const parents = new Map()
  const explored = []
  while (queue.length) {
    const current = queue.shift()
    explored.push(current)
    if (cellKey(current.row, current.column) === cellKey(goal.row, goal.column)) break
    getNeighbors(current, walls).forEach((neighbor) => {
      const key = cellKey(neighbor.row, neighbor.column)
      if (!visited.has(key)) {
        visited.add(key)
        parents.set(key, current)
        queue.push(neighbor)
      }
    })
  }
  return { explored, path: buildPath(parents, start, goal) }
}

// Estimate the remaining cost with Manhattan distance and choose the best cell.
function aStarSearch(start, goal, walls) {
  const open = [{ cell: start, score: 0 }]
  const distances = new Map([[cellKey(start.row, start.column), 0]])
  const parents = new Map()
  const explored = []
  while (open.length) {
    open.sort((left, right) => right.score - left.score)
    const current = open.pop().cell
    const currentKey = cellKey(current.row, current.column)
    explored.push(current)
    if (currentKey === cellKey(goal.row, goal.column)) break
    getNeighbors(current, walls).forEach((neighbor) => {
      const neighborKey = cellKey(neighbor.row, neighbor.column)
      const nextDistance = distances.get(currentKey) + 1
      if (nextDistance < (distances.get(neighborKey) ?? Infinity)) {
        distances.set(neighborKey, nextDistance)
        parents.set(neighborKey, current)
        const heuristic = Math.abs(neighbor.row - goal.row) + Math.abs(neighbor.column - goal.column)
        open.push({ cell: neighbor, score: nextDistance + heuristic })
      }
    })
  }
  return { explored, path: buildPath(parents, start, goal) }
}

// Create the initial grid state for a fresh visualization.
function createCells() {
  return Array.from({ length: ROWS * COLUMNS }, (_, index) => ({ row: Math.floor(index / COLUMNS), column: index % COLUMNS }))
}

// Render the controls, terrain grid, and search results.
function App() {
  const [algorithm, setAlgorithm] = useState('BFS')
  const [tool, setTool] = useState('wall')
  const [start, setStart] = useState(DEFAULT_START)
  const [goal, setGoal] = useState(DEFAULT_GOAL)
  const [walls, setWalls] = useState(new Set())
  const [visited, setVisited] = useState(new Set())
  const [path, setPath] = useState(new Set())
  const [status, setStatus] = useState('Ready to explore')
  const [runtime, setRuntime] = useState(null)

  // Apply the selected editing tool to a clicked cell.
  function handleCellClick(cell) {
    const key = cellKey(cell.row, cell.column)
    if (tool === 'start') {
      if (key !== cellKey(goal.row, goal.column)) setStart(cell)
    } else if (tool === 'goal') {
      if (key !== cellKey(start.row, start.column)) setGoal(cell)
    } else if (key !== cellKey(start.row, start.column) && key !== cellKey(goal.row, goal.column)) {
      setWalls((currentWalls) => {
        const nextWalls = new Set(currentWalls)
        if (nextWalls.has(key)) nextWalls.delete(key)
        else nextWalls.add(key)
        return nextWalls
      })
    }
    setVisited(new Set())
    setPath(new Set())
    setStatus('Grid updated')
  }

  // Run the selected search algorithm and show its result.
  function runSearch() {
    const startedAt = performance.now()
    const result = algorithm === 'BFS' ? breadthFirstSearch(start, goal, walls) : aStarSearch(start, goal, walls)
    const elapsed = performance.now() - startedAt
    setVisited(new Set(result.explored.map((cell) => cellKey(cell.row, cell.column))))
    setPath(new Set(result.path.map((cell) => cellKey(cell.row, cell.column))))
    setRuntime(elapsed)
    setStatus(result.path.length ? 'Path found' : 'No valid path')
  }

  // Clear the search result while preserving the map.
  function clearSearch() {
    setVisited(new Set())
    setPath(new Set())
    setRuntime(null)
    setStatus('Ready to explore')
  }

  // Reset the map to its original start and goal positions.
  function resetGrid() {
    setStart(DEFAULT_START)
    setGoal(DEFAULT_GOAL)
    setWalls(new Set())
    clearSearch()
  }

  const cells = createCells()
  const pathLength = path.size ? path.size - 1 : 0

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup"><div><p className="eyebrow">PATHFINDING</p><h1>Search algorithm visualizer</h1></div></div>
        <div className="status-chip">Status: {status}</div>
      </header>
      <section className="intro"><div><p className="eyebrow">SEARCH GRID</p><h2>Search algorithm visualizer</h2></div><p className="intro-copy">Choose an algorithm, place walls, and run the search.</p></section>
      <section className="workspace">
        <aside className="controls-panel">
          <div className="panel-heading"><span className="section-number">01</span><div><p className="eyebrow">CONTROLS</p><h3>Grid settings</h3></div></div>
          <div className="control-group"><label>Algorithm</label><div className="segmented-control">{['BFS', 'A*'].map((option) => <button key={option} className={algorithm === option ? 'selected' : ''} onClick={() => { setAlgorithm(option); clearSearch() }}>{option}</button>)}</div></div>
          <div className="control-group"><label>Draw mode</label><div className="tool-list"><button className={tool === 'wall' ? 'tool selected' : 'tool'} onClick={() => setTool('wall')}><span className="tool-swatch wall-swatch" /> Wall</button><button className={tool === 'start' ? 'tool selected' : 'tool'} onClick={() => setTool('start')}><span className="tool-swatch start-swatch" /> Start node</button><button className={tool === 'goal' ? 'tool selected' : 'tool'} onClick={() => setTool('goal')}><span className="tool-swatch goal-swatch" /> Goal node</button></div></div>
          <div className="legend"><div><span className="legend-swatch visited-swatch" /> Explored</div><div><span className="legend-swatch path-swatch" /> Final route</div></div>
          <div className="panel-actions"><button className="run-button" onClick={runSearch}><span>Run search</span><span className="arrow">↗</span></button><button className="text-button" onClick={resetGrid}>Reset field</button><button className="text-button" onClick={clearSearch}>Clear result</button></div>
        </aside>
        <div className="map-panel">
          <div className="map-heading"><div><span className="section-number">02</span><div><p className="eyebrow">GRID</p><h3>Map</h3></div></div><span className="map-size">{ROWS} × {COLUMNS}</span></div>
          <div className="grid" style={{ '--columns': COLUMNS }}>{cells.map((cell) => { const key = cellKey(cell.row, cell.column); const classes = ['cell']; if (walls.has(key)) classes.push('wall'); if (visited.has(key)) classes.push('visited'); if (path.has(key)) classes.push('path'); if (key === cellKey(start.row, start.column)) classes.push('start'); if (key === cellKey(goal.row, goal.column)) classes.push('goal'); return <button key={key} className={classes.join(' ')} onClick={() => handleCellClick(cell)} aria-label={`Row ${cell.row + 1}, column ${cell.column + 1}`} /> })}</div>
          <div className="map-footer"><span>CLICK CELLS TO EDIT</span><span>START {start.row + 1}:{start.column + 1} / GOAL {goal.row + 1}:{goal.column + 1}</span></div>
        </div>
      </section>
      <section className="metrics-panel"><div className="panel-heading"><span className="section-number">03</span><div><p className="eyebrow">RESULTS</p><h3>Search metrics</h3></div></div><div className="metric-grid"><div className="metric"><span>Algorithm</span><strong>{algorithm}</strong></div><div className="metric"><span>Explored nodes</span><strong>{visited.size || '—'}</strong></div><div className="metric"><span>Path length</span><strong>{path.size ? `${pathLength} steps` : '—'}</strong></div><div className="metric"><span>Runtime</span><strong>{runtime === null ? '—' : `${runtime.toFixed(2)} ms`}</strong></div></div></section>
      <footer><span>PATHFINDING VISUALIZER</span><span>{ROWS} ROWS / {COLUMNS} COLUMNS</span><span>Anjaliben Ghanshyambhai Valand and Keagan Anderson</span></footer>
    </main>
  )
}

export default App

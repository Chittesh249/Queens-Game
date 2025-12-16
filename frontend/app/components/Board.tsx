type BoardProps = {
  n: number
}

export default function Board({ n }: BoardProps) {
  if (n <= 0) return null

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${n}, 50px)`,
        gap: 0,
        marginTop: 20
      }}
    >
      {Array.from({ length: n * n }).map((_, index) => (
        <div
          key={index}
          style={{
            width: 50,
            height: 50,
            border: '1px solid black',
            backgroundColor: 'white'
          }}
        />
      ))}
    </div>
  )
}

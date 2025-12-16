type BoardProps = {
  n: number;
};

export default function Board({ n }: BoardProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${n}, 60px)`,
        gridTemplateRows: `repeat(${n}, 60px)`,
      }}
    >
      {Array.from({ length: n * n }).map((_, i) => (
        <div
          key={i}
          style={{
            width: "60px",
            height: "60px",
            border: "2px solid black",
            backgroundColor: "white",
          }}
        />
      ))}
    </div>
  );
}

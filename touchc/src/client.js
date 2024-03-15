const key =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZ3FydHBjcmN3anNwenR1a3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDkwNDI5MDksImV4cCI6MjAyNDYxODkwOX0.EZaxSpSQnJvIA6viW3dhiJVXTyRLJOzH6DQ_zbpMatU";
const url = "https://aagqrtpcrcwjspztuktn.supabase.co";
const database = supabase.createClient(url, key);

//dom elements
const distance = document.getElementById("distance");
const rotation = document.getElementById("rotation");
const tableName = "touch";

document.addEventListener("DOMContentLoaded", async () => {
  //subscribe to changes in the
  database
    .channel(tableName)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: tableName },
      (payload) => {
        handleInserts(payload.new);
      }
    )
    .subscribe();

  //select all data from touch
  let { data, error } = await database.from(tableName).select("*");
  handleInserts(data[0]);
});

function handleInserts(data) {
  distance.innerHTML = data.values.distance;
  rotation.innerHTML = data.values.rotation;
  const rect = document.getElementById("rect");
  rect.style.width = data.values.distance + "px";
  rect.style.transform = `rotate(${data.values.rotation}deg)`;
}

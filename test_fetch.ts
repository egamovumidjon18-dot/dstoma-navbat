async function run() {
  try {
    const res = await fetch("http://localhost:3000/api/clinics");
    console.log("Clinics:", await res.json());
  } catch (err) {
    console.error(err);
  }
}
run();

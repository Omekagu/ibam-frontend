import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import s from "./page.module.scss";

export const metadata: Metadata = {
  title: "Find a Doctor — iBam Health",
  description: "Browse hundreds of verified Nigerian doctors by specialty, availability, and price.",
};

const DOCTORS = [
  { emoji: "👨🏿‍⚕️", name: "Dr. Chukwuemeka Okafor", specialty: "General Practice", exp: "12 yrs", rating: 4.9, reviews: 312, price: "₦3,500", available: true },
  { emoji: "👩🏾‍⚕️", name: "Dr. Amara Nwosu",        specialty: "Paediatrics",      exp: "8 yrs",  rating: 4.8, reviews: 241, price: "₦4,500", available: true },
  { emoji: "👨🏽‍⚕️", name: "Dr. Bayo Adeleke",        specialty: "Cardiology",       exp: "15 yrs", rating: 4.9, reviews: 189, price: "₦6,000", available: false },
  { emoji: "👩🏿‍⚕️", name: "Dr. Fatima Suleiman",     specialty: "OB-GYN",           exp: "10 yrs", rating: 4.7, reviews: 274, price: "₦5,000", available: true },
  { emoji: "👨🏾‍⚕️", name: "Dr. Kunle Adeyemi",       specialty: "Dermatology",      exp: "7 yrs",  rating: 4.6, reviews: 153, price: "₦4,000", available: true },
  { emoji: "👩🏽‍⚕️", name: "Dr. Grace Eze",           specialty: "Internal Medicine", exp: "14 yrs", rating: 4.8, reviews: 298, price: "₦5,500", available: false },
  { emoji: "👨🏿‍⚕️", name: "Dr. Ahmed Musa",          specialty: "Psychiatry",       exp: "9 yrs",  rating: 4.7, reviews: 142, price: "₦5,000", available: true },
  { emoji: "👩🏾‍⚕️", name: "Dr. Ngozi Obi",           specialty: "Ophthalmology",    exp: "11 yrs", rating: 4.9, reviews: 167, price: "₦4,500", available: true },
];

const SPECIALTIES = ["All Specialties", "General Practice", "Paediatrics", "Cardiology", "OB-GYN", "Dermatology", "Internal Medicine", "Psychiatry", "Ophthalmology", "ENT", "Orthopaedics"];

function StarIcon() {
  return (
    <svg className={s.star} viewBox="0 0 20 20" fill="currentColor" width={13} height={13}>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export default function DoctorsPage() {
  return (
    <PageShell>
      <section className={s.hero}>
        <div className={s.heroInner}>
          <h1>Find your doctor</h1>
          <p>
            Browse 500+ MDCN-verified physicians. Filter by specialty,
            availability, and price — book in seconds.
          </p>
          <div className={s.searchBar}>
            <div className={s.searchIcon}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input type="text" placeholder="Search by name or specialty…" />
            <button type="button">Search</button>
          </div>
        </div>
      </section>

      <section className={s.body}>
        <div className={s.bodyInner}>

          {/* Filters */}
          <aside className={s.filters}>
            <h3>Filters</h3>

            <div className={s.filterGroup}>
              <h4>Specialty</h4>
              {SPECIALTIES.slice(0, 8).map((sp) => (
                <label key={sp} className={s.option}>
                  <input type="radio" name="specialty" defaultChecked={sp === "All Specialties"} />
                  {sp}
                </label>
              ))}
            </div>

            <div className={s.divider} />

            <div className={s.filterGroup}>
              <h4>Availability</h4>
              {["Any", "Available Now", "Today", "This Week"].map((a) => (
                <label key={a} className={s.option}>
                  <input type="radio" name="avail" defaultChecked={a === "Any"} />
                  {a}
                </label>
              ))}
            </div>

            <div className={s.divider} />

            <div className={s.filterGroup}>
              <h4>Price Range</h4>
              {["Any", "Under ₦3,000", "₦3,000–₦5,000", "Above ₦5,000"].map((p) => (
                <label key={p} className={s.option}>
                  <input type="radio" name="price" defaultChecked={p === "Any"} />
                  {p}
                </label>
              ))}
            </div>
          </aside>

          {/* Results */}
          <div className={s.results}>
            <h2>{DOCTORS.length} doctors found</h2>
            <div className={`${s.grid} reveal-stagger`}>
              {DOCTORS.map((doc) => (
                <div key={doc.name} className={`${s.card} reveal`}>
                  <div className={s.docAvatar}>{doc.emoji}</div>
                  <div className={s.docInfo}>
                    <div className={s.docTop}>
                      <div className={s.docName}>{doc.name}</div>
                      <span className={`${s.badge} ${doc.available ? s.available : s.busy}`}>
                        {doc.available ? "Available" : "Busy"}
                      </span>
                    </div>
                    <div className={s.specialty}>{doc.specialty}</div>
                    <div className={s.meta}>
                      <span><StarIcon />{doc.rating} ({doc.reviews})</span>
                      <span>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width={13} height={13}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {doc.exp} experience
                      </span>
                    </div>
                    <div className={s.docFooter}>
                      <div className={s.price}>{doc.price} <span>/ consultation</span></div>
                      <Link href="/signup" className={s.bookBtn}>Book Now</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>
    </PageShell>
  );
}

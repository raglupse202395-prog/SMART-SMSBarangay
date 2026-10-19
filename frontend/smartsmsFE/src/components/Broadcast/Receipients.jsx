import SearchInput from "../SearchInput";
import { useEffect, useState } from "react";
import { Chip } from "@mui/material";

export default function Receipients({ receipients = [], selectedResidentsNumber = [], setselectedResidentsNumber, recipientType }) {
  const allNumbers = receipients.map(r => r.phone).filter(Boolean);
  const allSelected = allNumbers.length > 0 && allNumbers.every(num => selectedResidentsNumber.includes(num));

  const [search, setSearch] = useState('');
  const addNumber = (number) => setselectedResidentsNumber([...selectedResidentsNumber, number]);
  const removeNumber = (number) => {
    if (selectedResidentsNumber.some((residentNum) => residentNum === number)) {
      const newNumbers = selectedResidentsNumber.filter((residentNum) => residentNum !== number);
      setselectedResidentsNumber(newNumbers);
    }
  }

  const handleSelectAll = () => {
    if (allSelected) setselectedResidentsNumber([]);
    else setselectedResidentsNumber(allNumbers);
  };

  return (
    <div className='broadcast-recipients'>
      <div className="upper-filter">
        <UpperFilter search={search} setSearch={setSearch} allSelected={allSelected} handleSelectAll={handleSelectAll} count={receipients.length} recipientType={recipientType} />
        <div className="receipients" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {displayResidents(receipients, search, addNumber, removeNumber, selectedResidentsNumber)}
        </div>
      </div>
    </div>
  )
}

const UpperFilter = ({ search, setSearch, allSelected, handleSelectAll, count, recipientType }) => {
  return (
    <div className="main-border">
      <div className="receipients-filter">
        <div className="receipients-filter-main">
          <h6>{recipientType === 'heads' ? 'Household Heads' : 'All Residents'} ({count})</h6>
        </div>
        <div className="filter-actions">
          <a href="#" onClick={e => { e.preventDefault(); handleSelectAll(); }}>
            {allSelected ? "Deselect all" : "Select all"}
          </a>
        </div>
      </div>
      <div style={{ padding: "10px 20px" }}>
        <SearchInput search={search} setSearch={setSearch} placeholder="Search by name..." />
      </div>
    </div>
  )
}

const ReceipientsCard = ({ id, name, street, age, number, addNumber, removeNumber, selectedResidentsNumber, isHouseholdHead, householdId }) => {
  const [isChecked, setIsChecked] = useState(false);

  const handleToggle = () => {
    if (!number) return; // Prevent clicking if no phone number
    const newCheckedState = !isChecked;
    setIsChecked(newCheckedState);
    if (newCheckedState) addNumber(number);
    else removeNumber(number);
  };

  useEffect(() => {
    setIsChecked(selectedResidentsNumber.includes(number));
  }, [selectedResidentsNumber, number]);

  return (
    <div className="check-sample" onClick={handleToggle} style={{ cursor: number ? "pointer" : "not-allowed", opacity: number ? 1 : 0.5 }}>
      <div>
        <input type="checkbox" id={id} name={id} checked={isChecked} onChange={handleToggle} disabled={!number} />
      </div>
      <div className="Infos" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="receipient-name">{name}</span>
            {isHouseholdHead && <Chip label={householdId || "HEAD"} size="small" color="primary" style={{ fontSize: '10px', height: '20px' }} />}
        </div>
        <div className="receipient-name-infos">
          {street} • {age} years old {!number && " • No Phone"}
        </div>
      </div>
    </div>
  );
};

const displayResidents = (receipients, search, addNumber, removeNumber, selectedResidentsNumber) => {
  const filteredResidents = search !== ""
    ? receipients.filter(person => person.name.toLowerCase().includes(search.toLowerCase()))
    : receipients;

  if (filteredResidents.length === 0) {
      return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No recipients found.</div>;
  }

  return filteredResidents.map(person => (
    <ReceipientsCard
      key={person.id}
      id={person.id}
      name={person.name}
      street={person.street}
      age={person.age}
      number={person.phone}
      addNumber={addNumber}
      removeNumber={removeNumber}
      selectedResidentsNumber={selectedResidentsNumber}
      isHouseholdHead={person.isHouseholdHead}
      householdId={person.householdId}
    />
  ));
};
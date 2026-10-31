// Файл содержит предметы, сеты, рецепты и связанные с ними константы.

function gearItem(id, name, slot, icon, price, shopTier, stats, desc) {
  return { id, name, slot, icon, price, shopTier, desc, ...stats };
}

// ── Редкость предметов: множитель базовых статов, число бонусов аффикса, шансы ──
const RARITY_TIERS = {
  common:    { name: "Обычный",    color: "#6b6b6b", mult: 1.0,  bonusCount: 0, chance: 0.60, sellMult: 1.0 },
  uncommon:  { name: "Необычный",  color: "#4caf50", mult: 1.1,  bonusCount: 1, chance: 0.25, sellMult: 1.5 },
  rare:      { name: "Редкий",     color: "#2196f3", mult: 1.25, bonusCount: 2, chance: 0.10, sellMult: 2.5 },
  epic:      { name: "Эпический",  color: "#9c27b0", mult: 1.5,  bonusCount: 3, chance: 0.04, sellMult: 4.0 },
  legendary: { name: "Легендарный",color: "#ff9800", mult: 1.8,  bonusCount: 4, chance: 0.0, sellMult: 8.0, unique: true },
};

// Аффиксы: тема предмета (часть названия) и пул статов для бонусов [min..max].
const AFFIXES = [
  { id: "bear",   name: "Медведя", stats: [{ id: "str", min: 1, max: 2 }, { id: "end", min: 1, max: 2 }] },
  { id: "eagle",  name: "Орла",    stats: [{ id: "agi", min: 1, max: 2 }, { id: "int", min: 1, max: 2 }] },
  { id: "wolf",   name: "Волка",   stats: [{ id: "str", min: 1, max: 2 }, { id: "crit", min: 1, max: 3 }] },
  { id: "boar",   name: "Вепря",   stats: [{ id: "end", min: 2, max: 3 }, { id: "hp", min: 5, max: 15 }] },
  { id: "falcon", name: "Сокола",  stats: [{ id: "agi", min: 1, max: 2 }, { id: "dodge", min: 1, max: 3 }] },
  { id: "owl",    name: "Совы",    stats: [{ id: "int", min: 1, max: 2 }, { id: "mana", min: 5, max: 15 }] },
];

// Уникальные эффекты легендарных предметов.
const UNIQUE_EFFECTS = [
  { id: "lifesteal", name: "Вампиризм", desc: "Восстанавливает 5% нанесённого урона в HP." },
  { id: "thorns",    name: "Шипы",      desc: "Отражает 10% полученного урона." },
  { id: "swift",     name: "Скорость",  desc: "+5% уворота." },
  { id: "lucky",     name: "Удача",     desc: "+5% шанс крита." },
];
const LIFESTEAL_PERCENT = 0.05;
const THORNS_PERCENT = 0.1;

const ITEMS = {
  // ── Оружие (27 предметов, три тира) ──────────────────────────────────────
  // Тир 1 «Железо» — этаж 1
  iron_long_sword: { id: "iron_long_sword", name: "Железный длинный меч", slot: "mainhand", icon: "assets/icons/weapons/swords/iron_long_sword.png", atk: 27, weaponType: "sword", handed: "1h", damage: { slashing: 19, piercing: 8, bludgeoning: 0 }, price: 115, shopTier: 1, desc: "Длинный клинок, требующий обеих рук. Держит дистанцию и рубит широко." },
  iron_short_sword: { id: "iron_short_sword", name: "Железный короткий меч", slot: "mainhand", icon: "assets/icons/weapons/swords/iron_short_sword.png", atk: 22, crit: 2, weaponType: "sword", handed: "1h", damage: { slashing: 13, piercing: 9, bludgeoning: 0 }, price: 85, shopTier: 1, desc: "Быстрый и точный. Оставляет вторую руку для щита." },
  iron_rapier: { id: "iron_rapier", name: "Железная рапира", slot: "mainhand", icon: "assets/icons/weapons/swords/iron_rapier.png", atk: 21, crit: 6, weaponType: "sword", handed: "1h", damage: { slashing: 4, piercing: 17, bludgeoning: 0 }, price: 105, shopTier: 1, desc: "Тонкий клинок для точных уколов в щели брони." },
  iron_hatchet: { id: "iron_hatchet", name: "Железный топорик", slot: "mainhand", icon: "assets/icons/weapons/axes/iron_hatchet.png", atk: 19, weaponType: "axe", handed: "1h", damage: { slashing: 15, piercing: 0, bludgeoning: 3 }, price: 80, shopTier: 1, desc: "Плотницкий инструмент, ставший оружием." },
  iron_great_axe: { id: "iron_great_axe", name: "Железная секира", slot: "mainhand", icon: "assets/icons/weapons/axes/iron_great_axe.png", atk: 29, weaponType: "axe", handed: "2h", damage: { slashing: 24, piercing: 0, bludgeoning: 5 }, price: 150, shopTier: 1, desc: "Древко подлиннее — и размах шире." },
  iron_mace: { id: "iron_mace", name: "Железная булава", slot: "mainhand", icon: "assets/icons/weapons/maces/iron_mace.png", atk: 21, weaponType: "mace", handed: "1h", damage: { slashing: 2, piercing: 0, bludgeoning: 18 }, price: 90, shopTier: 1, desc: "Грубая дробящая простота. Против кольчуги и лат." },
  iron_maul: { id: "iron_maul", name: "Железный молот", slot: "mainhand", icon: "assets/icons/weapons/maces/iron_maul.png", atk: 28, weaponType: "mace", handed: "2h", damage: { slashing: 2, piercing: 0, bludgeoning: 25 }, price: 155, shopTier: 1, desc: "Кузнечный молот, перепрофилированный по врагам." },
  iron_spear: { id: "iron_spear", name: "Железное копьё", slot: "mainhand", icon: "assets/icons/weapons/spears/iron_spear.png", atk: 23, weaponType: "spear", handed: "2h", damage: { slashing: 3, piercing: 18, bludgeoning: 0 }, price: 120, shopTier: 1, desc: "Дешёвое древко с честным жалом." },
  iron_great_sword: { id: "iron_great_sword", name: "Железный двуручный меч", slot: "mainhand", icon: "assets/icons/weapons/swords/iron_great_sword.png", atk: 32, weaponType: "sword", handed: "2h", damage: { slashing: 30, piercing: 6, bludgeoning: 0 }, price: 170, shopTier: 1, desc: "Тяжёлый клинок с высоким рубящим уроном. Обе руки заняты." },

  // Тир 2 «Хладосталь» — этаж 2
  coldsteel_long_sword: { id: "coldsteel_long_sword", name: "Длинный меч из хладостали", slot: "mainhand", icon: "assets/icons/weapons/swords/coldsteel_long_sword.png", atk: 40, weaponType: "sword", handed: "1h", damage: { slashing: 28, piercing: 12, bludgeoning: 0 }, price: 260, shopTier: 2, desc: "Хладосталь держит кромку дольше железа и не тускнеет в подземелье." },
  coldsteel_short_sword: { id: "coldsteel_short_sword", name: "Короткий меч из хладостали", slot: "mainhand", icon: "assets/icons/weapons/swords/coldsteel_short_sword.png", atk: 33, crit: 3, weaponType: "sword", handed: "1h", damage: { slashing: 20, piercing: 14, bludgeoning: 0 }, price: 210, shopTier: 2, desc: "Тот же баланс, что у железного, но сталь честнее." },
  coldsteel_rapier: { id: "coldsteel_rapier", name: "Рапира из хладостали", slot: "mainhand", icon: "assets/icons/weapons/swords/coldsteel_rapier.png", atk: 32, crit: 8, weaponType: "sword", handed: "1h", damage: { slashing: 6, piercing: 26, bludgeoning: 0 }, price: 240, shopTier: 2, desc: "Укол длиннее, сталь звонче." },
  coldsteel_hatchet: { id: "coldsteel_hatchet", name: "Топорик из хладостали", slot: "mainhand", icon: "assets/icons/weapons/axes/coldsteel_hatchet.png", atk: 29, weaponType: "axe", handed: "1h", damage: { slashing: 23, piercing: 0, bludgeoning: 4 }, price: 190, shopTier: 2, desc: "Лезвие правильной стали не вязнет в коже." },
  coldsteel_great_axe: { id: "coldsteel_great_axe", name: "Секира из хладостали", slot: "mainhand", icon: "assets/icons/weapons/axes/coldsteel_great_axe.png", atk: 45, weaponType: "axe", handed: "2h", damage: { slashing: 37, piercing: 0, bludgeoning: 8 }, price: 340, shopTier: 2, desc: "Каждый замах — обещание." },
  coldsteel_mace: { id: "coldsteel_mace", name: "Булава из хладостали", slot: "mainhand", icon: "assets/icons/weapons/maces/coldsteel_mace.png", atk: 32, weaponType: "mace", handed: "1h", damage: { slashing: 3, piercing: 0, bludgeoning: 28 }, price: 220, shopTier: 2, desc: "Ребра стали сиротливо звенят по шлемам." },
  coldsteel_maul: { id: "coldsteel_maul", name: "Молот из хладостали", slot: "mainhand", icon: "assets/icons/weapons/maces/coldsteel_maul.png", atk: 44, weaponType: "mace", handed: "2h", damage: { slashing: 3, piercing: 0, bludgeoning: 39 }, price: 360, shopTier: 2, desc: "Против лат — это уже не оружие, а решение." },
  coldsteel_spear: { id: "coldsteel_spear", name: "Копьё из хладостали", slot: "mainhand", icon: "assets/icons/weapons/spears/coldsteel_spear.png", atk: 35, weaponType: "spear", handed: "2h", damage: { slashing: 5, piercing: 28, bludgeoning: 0 }, price: 250, shopTier: 2, desc: "Жало, что держит врага на расстоянии." },
  coldsteel_great_sword: { id: "coldsteel_great_sword", name: "Двуручный меч из хладостали", slot: "mainhand", icon: "assets/icons/weapons/swords/coldsteel_great_sword.png", atk: 48, weaponType: "sword", handed: "2h", damage: { slashing: 45, piercing: 9, bludgeoning: 0 }, price: 390, shopTier: 2, desc: "Клинок длиной в человека. Рубящий удар пробивает кожаные доспехи." },

  // Тир 3 «Руны» — этаж 3
  runic_long_sword: { id: "runic_long_sword", name: "Рунический длинный меч", slot: "mainhand", icon: "assets/icons/weapons/swords/runic_long_sword.png", atk: 58, weaponType: "sword", handed: "1h", damage: { slashing: 41, piercing: 17, bludgeoning: 0 }, price: 520, shopTier: 3, desc: "Руны на клинке проступают перед каждым ударом." },
  runic_short_sword: { id: "runic_short_sword", name: "Рунический короткий меч", slot: "mainhand", icon: "assets/icons/weapons/swords/runic_short_sword.png", atk: 47, crit: 4, weaponType: "sword", handed: "1h", damage: { slashing: 29, piercing: 20, bludgeoning: 0 }, price: 430, shopTier: 3, desc: "Короткий клинок с рунной насечкой по долу." },
  runic_rapier: { id: "runic_rapier", name: "Руническая рапира", slot: "mainhand", icon: "assets/icons/weapons/swords/runic_rapier.png", atk: 46, crit: 10, weaponType: "sword", handed: "1h", damage: { slashing: 8, piercing: 38, bludgeoning: 0 }, price: 480, shopTier: 3, desc: "Острие находит щель, даже если её нет." },
  runic_hatchet: { id: "runic_hatchet", name: "Рунический топорик", slot: "mainhand", icon: "assets/icons/weapons/axes/runic_hatchet.png", atk: 42, weaponType: "axe", handed: "1h", damage: { slashing: 33, piercing: 0, bludgeoning: 6 }, price: 390, shopTier: 3, desc: "Лёгкий топорик, чьё лезвие светится в темноте." },
  runic_great_axe: { id: "runic_great_axe", name: "Руническая секира", slot: "mainhand", icon: "assets/icons/weapons/axes/runic_great_axe.png", atk: 65, weaponType: "axe", handed: "2h", damage: { slashing: 54, piercing: 0, bludgeoning: 12 }, price: 650, shopTier: 3, desc: "Широкая дуга лезвия оставляет после себя тишину." },
  runic_mace: { id: "runic_mace", name: "Руническая булава", slot: "mainhand", icon: "assets/icons/weapons/maces/runic_mace.png", atk: 46, weaponType: "mace", handed: "1h", damage: { slashing: 4, piercing: 0, bludgeoning: 40 }, price: 420, shopTier: 3, desc: "Дробящий удар, усиленный руной на навершии." },
  runic_maul: { id: "runic_maul", name: "Рунический молот", slot: "mainhand", icon: "assets/icons/weapons/maces/runic_maul.png", atk: 63, weaponType: "mace", handed: "2h", damage: { slashing: 4, piercing: 0, bludgeoning: 56 }, price: 700, shopTier: 3, desc: "От его удара трескаются латы и каменные плиты." },
  runic_spear: { id: "runic_spear", name: "Руническое копьё", slot: "mainhand", icon: "assets/icons/weapons/spears/runic_spear.png", atk: 50, weaponType: "spear", handed: "2h", damage: { slashing: 7, piercing: 40, bludgeoning: 0 }, price: 500, shopTier: 3, desc: "Древко покрыто рунами, а жало не знает тупого края." },
  runic_great_sword: { id: "runic_great_sword", name: "Рунический двуручный меч", slot: "mainhand", icon: "assets/icons/weapons/swords/runic_great_sword.png", atk: 69, weaponType: "sword", handed: "2h", damage: { slashing: 65, piercing: 13, bludgeoning: 0 }, price: 760, shopTier: 3, desc: "Высокий рубящий урон. Против кожи и ткани — почти приговор." },

  rusty_knife: { id: "rusty_knife", name: "Ржавый нож", slot: "mainhand", icon: "🔪", atk: 4, weaponType: "sword", handed: "1h", damage: { slashing: 2, piercing: 4, bludgeoning: 0 }, price: 0, shopTier: 0, desc: "Всё, что осталось от прошлой жизни." },
  wood_club: { id: "wood_club", name: "Дубина", slot: "mainhand", icon: "🏏", atk: 16, weaponType: "mace", handed: "1h", damage: { slashing: 2, piercing: 1, bludgeoning: 16 }, price: 45, shopTier: 1, desc: "Тяжёлая, но честная." },

  rags: { id: "rags", name: "Рваная рубаха", slot: "chest", icon: "assets/icons/armor/chest/linen_chest.png", def: 0, hp: 0, armorType: "cloth", price: 0, shopTier: 0, desc: "Лучше, чем ничего." },
  gambeson: { id: "gambeson", name: "Стёганый гамбезон", slot: "chest", icon: "assets/icons/armor/chest/linen_chest.png", def: 4, hp: 40, armorType: "cloth", mana: 5, price: 40, shopTier: 1, desc: "Мягкая броня, но держит удар." },
  leather_armor: { id: "leather_armor", name: "Кожаный доспех", slot: "chest", icon: "assets/icons/armor/chest/leather_chest.png", def: 6, hp: 60, armorType: "leather", price: 70, shopTier: 1, desc: "Пахнет дёгтем и старым потом." },
  chain: { id: "chain", name: "Кольчуга", slot: "chest", icon: "assets/icons/armor/chest/coldsteel_chain_chest.png", def: 10, hp: 90, armorType: "chain", price: 210, shopTier: 2, desc: "Тысяча колец, ни одного лишнего." },
  scale: { id: "scale", name: "Чешуйчатый доспех", slot: "chest", icon: "assets/icons/armor/chest/coldsteel_chain_chest.png", def: 12, hp: 110, armorType: "chain", price: 300, shopTier: 2, desc: "Чешуя снята с чего-то большого." },
  plate: { id: "plate", name: "Латный доспех", slot: "chest", icon: "assets/icons/armor/chest/runic_plate_chest.png", def: 16, hp: 120, armorType: "plate", price: 600, shopTier: 3, desc: "В нём слышно только собственное дыхание." },

  wood_shield: { id: "wood_shield", name: "Деревянный щит", slot: "offhand", icon: "assets/icons/shields/wood_shield.webp", def: 2, block: 1, price: 55, shopTier: 1, desc: "Третья зона блока." },
  kite_shield: { id: "kite_shield", name: "Стальной каплевидный щит", slot: "offhand", icon: "assets/icons/shields/iron_shield.webp", def: 8, block: 1, price: 200, shopTier: 2, desc: "Прикрывает корпус целиком." },
  tower_shield: { id: "tower_shield", name: "Укрепленный башенный щит", slot: "offhand", icon: "assets/icons/shields/iron_shield.webp", def: 10, block: 1, dodge: -2, price: 300, shopTier: 2, desc: "Стена, которую можно носить. В уклоне почти не помогает." },
  parrying_dagger: { id: "parrying_dagger", name: "Кинжал парирования", slot: "offhand", icon: "🗡️", atk: 12, crit: 2, weaponType: "sword", handed: "1h", damage: { slashing: 3, piercing: 12, bludgeoning: 0 }, price: 160, shopTier: 2, desc: "Вторая рука тоже умеет ранить." },

  worn_hood: gearItem("worn_hood", "Поношенный капюшон", "head", "assets/icons/armor/head/linen_head.png", 0, 0, { def: 0, hp: 0 }, "Ткань, которую не жалко потерять."),
  patched_pants: gearItem("patched_pants", "Штаны в заплатках", "legs", "assets/icons/armor/legs/linen_legs.png", 0, 0, { def: 0, hp: 0 }, "Заплатка на заплатке."),
  worn_boots: gearItem("worn_boots", "Стоптанные сапоги", "feet", "assets/icons/armor/feet/linen_feet.png", 0, 0, { def: 0, hp: 0 }, "Скрипят на каждом шагу."),
  head_cloth: gearItem("head_cloth", "Тканевый капюшон", "head", "assets/icons/armor/head/linen_head.png", 25, 1, { def: 2, hp: 15 }, "Плотная ткань лучше, чем ничего."),
  head_iron: gearItem("head_iron", "Железный шлем", "head", "assets/icons/armor/head/iron_head.webp", 110, 2, { def: 6, hp: 40 }, "Простой, тяжёлый, надёжный."),
  head_crystal: gearItem("head_crystal", "Кристальный шлем", "head", "assets/icons/armor/head/runic_head.png", 320, 3, { def: 8, hp: 60 }, "Грани ловят свет и чужой удар."),
  shoulder_leather: gearItem("shoulder_leather", "Кожаные наплечники", "shoulder", "assets/icons/armor/shoulders/leather_shoulders.png", 25, 1, { def: 2, hp: 15 }, "Ремни и куски кожи."),
  shoulder_iron: gearItem("shoulder_iron", "Железные наплечники", "shoulder", "assets/icons/armor/shoulders/iron_plate_shoulders.webp", 100, 2, { def: 4, hp: 40 }, "Держат удар сверху."),
  shoulder_crystal: gearItem("shoulder_crystal", "Кристальные наплечники", "shoulder", "assets/icons/armor/shoulders/runic_shoulders.png", 300, 3, { def: 6, hp: 50 }, "Осколки срослись в броню."),
  back_cloak: gearItem("back_cloak", "Рваный плащ", "back", "assets/icons/armor/chest/linen_chest.png", 20, 1, { def: 0, hp: 15 }, "Холодный ветер всё равно пробирается."),
  back_guard: gearItem("back_guard", "Плащ караульного", "back", "assets/icons/armor/chest/woolen_chest.png", 90, 2, { def: 2, hp: 30 }, "Плотная ткань с чужого плеча."),
  back_crystal: gearItem("back_crystal", "Кристальный плащ", "back", "assets/icons/armor/chest/runic_chest.png", 280, 3, { def: 4, hp: 40 }, "Ткань, будто покрытая инеем."),
  wrist_leather: gearItem("wrist_leather", "Кожаные наручи", "wrist", "assets/icons/misc/leather_wrists.png", 20, 1, { def: 2, hp: 10 }, "Защищают от случайного пореза."),
  wrist_chain: gearItem("wrist_chain", "Кольчужные наручи", "wrist", "assets/icons/misc/coldsteel_chain_wrists.png", 85, 2, { def: 4, hp: 25 }, "Мелкие кольца, плотная посадка."),
  wrist_crystal: gearItem("wrist_crystal", "Кристальные наручи", "wrist", "assets/icons/misc/runic_wrists.png", 260, 3, { def: 4, hp: 30 }, "Холодят руку даже через ткань."),
  hands_gloves: gearItem("hands_gloves", "Рабочие перчатки", "hands", "assets/icons/armor/hands/leather_hands.png", 20, 1, { def: 2, hp: 10 }, "Ладони уже не горят."),
  hands_iron: gearItem("hands_iron", "Железные рукавицы", "hands", "assets/icons/armor/hands/iron_plate_hands.webp", 85, 2, { def: 4, hp: 25 }, "Кулак становится доводом."),
  hands_crystal: gearItem("hands_crystal", "Кристальные рукавицы", "hands", "assets/icons/armor/hands/runic_hands.webp", 260, 3, { def: 2, hp: 6 }, "Пальцы двигаются, кристалл звенит."),
  waist_rope: gearItem("waist_rope", "Верёвочный пояс", "waist", "assets/icons/misc/linen_waist.png", 20, 1, { def: 2, hp: 15 }, "Держит штаны и надежду."),
  waist_plate: gearItem("waist_plate", "Пояс из пластин", "waist", "assets/icons/misc/iron_plate_waist.png", 90, 2, { def: 4, hp: 30 }, "Пластины стучат при ходьбе."),
  waist_crystal: gearItem("waist_crystal", "Кристальный пояс", "waist", "assets/icons/misc/runic_waist.png", 270, 3, { def: 4, hp: 40 }, "Тяжёлый, но держит спину."),
  legs_leather: gearItem("legs_leather", "Кожаные штаны", "legs", "assets/icons/armor/legs/leather_legs.png", 25, 1, { def: 2, hp: 20 }, "Мягкие, зато не рвутся сразу."),
  legs_chain: gearItem("legs_chain", "Кольчужные штаны", "legs", "assets/icons/armor/legs/coldsteel_chain_pants.png", 110, 2, { def: 6, hp: 40 }, "Тяжело шагать, легко стоять."),
  legs_crystal: gearItem("legs_crystal", "Кристальные поножи", "legs", "assets/icons/armor/legs/runic_legs.png", 320, 3, { def: 8, hp: 60 }, "Каждый шаг отдаётся звоном."),
  feet_leather: gearItem("feet_leather", "Кожаные сапоги", "feet", "assets/icons/armor/feet/leather_feet.png", 25, 1, { def: 2, hp: 15 }, "Подошва ещё держится."),
  feet_iron: gearItem("feet_iron", "Железные сапоги", "feet", "assets/icons/armor/feet/iron_plate_boots.png", 90, 2, { def: 4, hp: 30 }, "Гулкий шаг по каменным плитам."),
  feet_crystal: gearItem("feet_crystal", "Кристальные сапоги", "feet", "assets/icons/armor/feet/runic_feet.png", 270, 3, { def: 6, hp: 40 }, "Ступня вмерзает в камень."),

  neck_bone: gearItem("neck_bone", "Грубый амулет", "neck", "📿", 30, 1, { hp: 25 }, "Грубый кусок малахита, наспех привязанный к ремешку."),
  neck_guard: gearItem("neck_guard", "Медальон караульного", "neck", "📿", 110, 2, { hp: 40, crit: 1 }, "Знак поста, который давно не сменяли."),
  neck_crystal: gearItem("neck_crystal", "Кристальный подвесок", "neck", "💠", 330, 3, { hp: 60, crit: 2 }, "Внутри что-то медленно пульсирует."),
  ring_copper: gearItem("ring_copper", "Медное кольцо", "ring", "💍", 35, 1, { crit: 1 }, "Тусклое, но своё."),
  ring_silver: gearItem("ring_silver", "Кольцо из холодного серебра", "ring", "💍", 120, 2, { crit: 2, hp: 20 }, "Тяжелое кольцо, выкованное из холодного серебра. Охраняет владельца от злых чар."),
  ring_crystal: gearItem("ring_crystal", "Кристальное кольцо", "ring", "💍", 350, 3, { crit: 3, hp: 20 }, "Осколок, оправленный в серебро."),
  trinket_coin: gearItem("trinket_coin", "Счастливая монета", "trinket", "💰", 35, 1, { dodge: 1 }, "Счастливая, пока не потрачена."),
  trinket_totem: gearItem("trinket_totem", "Железный тотем", "trinket", "🔮", 120, 2, { dodge: 2, hp: 20 }, "Тёплый, если долго держать."),
  trinket_shard: gearItem("trinket_shard", "Кристальный осколок", "trinket", "💠", 350, 3, { dodge: 3, crit: 1 }, "Показывает, куда придётся удар."),

  // ── Новое оружие (weaponType/handed/damage) ──
  claws: { id: "claws", name: "Когти", slot: "mainhand", icon: "🐾", atk: 22, crit: 5, weaponType: "claw", handed: "1h", damage: { slashing: 13, piercing: 3, bludgeoning: 0 }, price: 40, shopTier: 1, desc: "Четыре дуги ржавого металла. Не для галантности." },

  // ── Тир 1 «Железо» (shopTier: 1, ниша 50–150) ──

  // ── Щиты (offhand): активная защита, armorType не нужен — зоны тела они не закрывают ──
  iron_shield: { id: "iron_shield", name: "Железный щит", slot: "offhand", icon: "assets/icons/shields/iron_shield.webp", def: 6, block: 1, price: 120, shopTier: 1, desc: "Тяжёлый каплевидный щит из железа. Надёжно прикрывает корпус от ударов." },

  // ── Тир 2 «Сталь» (shopTier: 2, ниша 150–350) ──

  // ── Новая броня (armorType) ──
  wanderer_coat: gearItem("wanderer_coat", "Плащ странника", "chest", "assets/icons/armor/chest/linen_chest.png", 35, 1, { def: 3, hp: 45, mana: 8, armorType: "cloth" }, "Стёганая ткань, пахнущая дорогой и дымом."),
  mage_robe: gearItem("mage_robe", "Мантия чародея", "chest", "assets/icons/armor/chest/linen_chest.png", 80, 1, { def: 2, hp: 30, mana: 40, armorType: "cloth" }, "Ткань хранит тепло чужих заклинаний."),
  riveted_chain: gearItem("riveted_chain", "Клёпаная кольчуга", "chest", "assets/icons/armor/chest/runic_chain_chest.png", 330, 3, { def: 13, hp: 100, armorType: "chain" }, "Каждое кольцо расклёпано вручную."),
  knight_plate: gearItem("knight_plate", "Полный латный доспех", "chest", "assets/icons/armor/chest/runic_plate_chest.png", 620, 3, { def: 18, hp: 140, dodge: -6, armorType: "plate" }, "Вес гасит чужие удары и вашу прыть."),
  hood_mage: gearItem("hood_mage", "Капюшон чародея", "head", "assets/icons/armor/head/woolen_head.png", 60, 2, { def: 2, hp: 15, mana: 20, armorType: "cloth" }, "Тесьма вдоль шва отводит лишние мысли."),
  scout_gloves: gearItem("scout_gloves", "Разведческие перчатки", "hands", "assets/icons/armor/hands/leather_hands.png", 45, 1, { def: 2, hp: 10, dodge: 2, armorType: "leather" }, "Мягкая кожа, усиленная на ладонях."),
  scout_boots: gearItem("scout_boots", "Сапоги разведчика", "feet", "assets/icons/armor/feet/leather_feet.png", 50, 1, { def: 2, hp: 15, dodge: 2, armorType: "leather" }, "Подошва гасит звук собственных шагов."),
  plate_gorget: gearItem("plate_gorget", "Латный воротник", "neck", "assets/icons/armor/head/coldsteel_plate_head.png", 140, 2, { def: 4, hp: 25, armorType: "plate" }, "Кольцо стали, прикрывающее горло."),

  // ── Броня тир 1 (Железо) ──
  student_robe: gearItem("student_robe", "Ученическая роба", "chest", "assets/icons/armor/chest/linen_chest.png", 50, 1, { def: 2, hp: 10, mana: 10, armorType: "cloth" }, "Роба ученика алхимика — ткань теперь пахнет травами."),
  rust_chain: gearItem("rust_chain", "Ржавая кольчуга", "chest", "assets/icons/armor/chest/iron_chain_chest.png", 120, 1, { def: 8, hp: 30, armorType: "chain" }, "Кольца держат, пока не смотрят слишком пристально."),
  iron_chainmail: { id: "iron_chainmail", name: "Железная кольчуга", slot: "chest", armorType: "chain", def: 9, hp: 80, price: 140, shopTier: 1, icon: "assets/icons/armor/chest/iron_chain_chest.png", desc: "Плотное плетение железных колец. Хорошо держит режущие удары." },
  dented_plate: gearItem("dented_plate", "Мятые латы", "chest", "assets/icons/armor/chest/iron_plate_chest.webp", 150, 1, { def: 12, hp: 40, dodge: -5, armorType: "plate" }, "В наследство от чьей-то глупости. Но сталь есть сталь."),

  // ── Тир 1: полные комплекты брони (ткань / кожа / кольчуга / латы) ──
  shoulder_cloth: gearItem("shoulder_cloth", "Тканевые накидки", "shoulder", "assets/icons/armor/shoulders/linen_shoulders.png", 18, 1, { def: 1, hp: 10, armorType: "cloth" }, "Несколько слоёв плотной ткани на плечах."),
  wrist_cloth: gearItem("wrist_cloth", "Тканевые обмотки", "wrist", "assets/icons/misc/linen_wrist.png", 15, 1, { def: 1, hp: 10, armorType: "cloth" }, "Плотно стянутая ткань вместо наручей."),
  hands_cloth: gearItem("hands_cloth", "Тканевые перчатки", "hands", "assets/icons/armor/hands/linen_gloves.png", 15, 1, { def: 1, hp: 10, armorType: "cloth" }, "Тонкие, зато руки не мёрзнут."),
  legs_cloth: gearItem("legs_cloth", "Тканевые штаны", "legs", "assets/icons/armor/legs/linen_legs.png", 20, 1, { def: 1, hp: 10, armorType: "cloth" }, "Простая материя, подшитая у колен."),
  feet_cloth: gearItem("feet_cloth", "Тканевые тапочки", "feet", "assets/icons/armor/feet/linen_feet.png", 15, 1, { def: 1, hp: 10, armorType: "cloth" }, "Мягко ступают по каменным плитам."),

  head_leather: gearItem("head_leather", "Кожаный капюшон", "head", "assets/icons/armor/head/leather_head.png", 35, 1, { def: 2, hp: 15, armorType: "leather" }, "Кожа, пахнущая дёгтем, прикрывает голову и шею."),
  waist_leather: gearItem("waist_leather", "Кожаный ремень", "waist", "assets/icons/misc/leather_waist.png", 30, 1, { def: 2, hp: 15, armorType: "leather" }, "Широкий ремень с железной пряжкой."),

  head_chain: gearItem("head_chain", "Кольчужный капюшон", "head", "assets/icons/armor/head/iron_chain_head.png", 90, 1, { def: 4, hp: 25, armorType: "chain" }, "Кольца прикрывают шею и затылок."),
  shoulder_chain: gearItem("shoulder_chain", "Кольчужные наплечники", "shoulder", "assets/icons/armor/shoulders/iron_chain_shoulders.png", 95, 1, { def: 4, hp: 25, armorType: "chain" }, "Плечи в железных кольцах."),
  hands_chain: gearItem("hands_chain", "Кольчужные рукавицы", "hands", "assets/icons/armor/hands/iron_chain_hands.png", 85, 1, { def: 3, hp: 20, armorType: "chain" }, "Пальцы гнутся, удары держат."),
  waist_chain: gearItem("waist_chain", "Кольчужный пояс", "waist", "assets/icons/misc/iron_chain_waist.png", 80, 1, { def: 3, hp: 20, armorType: "chain" }, "Кольца свисают до бёдер."),
  feet_chain: gearItem("feet_chain", "Кольчужные сапоги", "feet", "assets/icons/armor/feet/iron_chain_feet.png", 100, 1, { def: 4, hp: 25, armorType: "chain" }, "Шаг тяжёлый, зато голень закрыта."),

  wrist_iron: gearItem("wrist_iron", "Железные наручи", "wrist", "assets/icons/misc/iron_plate_wrists.webp", 160, 1, { def: 5, hp: 30, armorType: "plate" }, "Железо на предплечье гасит удар."),
  legs_iron: gearItem("legs_iron", "Железные поножи", "legs", "assets/icons/armor/legs/iron_plate_legs.webp", 190, 1, { def: 6, hp: 40, armorType: "plate" }, "Пластины на бёдрах и голенях."),

  // ── Броня тир 2 (Сталь) ──
  dense_cloth: gearItem("dense_cloth", "Плотная ткань", "chest", "assets/icons/armor/chest/woolen_chest.png", 150, 2, { def: 4, hp: 20, mana: 20, armorType: "cloth" }, "Слои плотной ткани, между которыми скрывают браслеты ткача."),
  steel_chainmail: { id: "steel_chainmail", name: "Стальная кольчуга", slot: "chest", armorType: "chain", def: 14, hp: 110, price: 280, shopTier: 2, icon: "assets/icons/armor/chest/coldsteel_chain_chest.png", desc: "Тяжёлая, но надёжная броня, способная остановить даже меч." },
  steel_plate: gearItem("steel_plate", "Стальные латы", "chest", "assets/icons/armor/chest/coldsteel_plate_chest.png", 400, 2, { def: 20, hp: 80, dodge: -10, armorType: "plate" }, "Полный машинный вес стали; уклониться — долгая история."),

  hp_small: { id: "hp_small", name: "Малое зелье лечения", slot: "potion", icon: "🧪", type: "potion", effect: "hp", amount: 60, price: 20, shopTier: 1, desc: "Восстанавливает 60 HP." },
  hp_big:   { id: "hp_big",   name: "Большое зелье лечения", slot: "potion", icon: "⚗️", type: "potion", effect: "hp", amount: 120, price: 45, shopTier: 1, desc: "Восстанавливает 120 HP." },
  mana_small: { id: "mana_small", name: "Зелье маны", slot: "potion", icon: "🔷", type: "potion", effect: "mana", amount: 20, price: 20, shopTier: 1, desc: "Восстанавливает 20 маны." },
  smoke_bomb: { id: "smoke_bomb", name: "Дымовая бомба", icon: "💨", type: "combat", effect: "smoke", price: 30, desc: "Враг пропускает следующий удар.", slot: "potion" },
  fire_flask: { id: "fire_flask", name: "Греческий огонь", icon: "🔥", type: "combat", effect: "fire", damage: 20, price: 40, desc: "Наносит 20 урона, игнорируя броню.", slot: "potion" },
  poison_vial: { id: "poison_vial", name: "Флакон с ядом", icon: "🧪", type: "combat", effect: "poison", damage: 5, turns: 3, price: 35, desc: "Наносит 5 урона в течение 3 ходов.", slot: "potion", shopTier: 1 },
// === ITEMS: Холодное железо (этаж 2) ===

  cold_iron_shield: { id: "cold_iron_shield", name: "Щит из холодного железа", slot: "offhand", icon: "assets/icons/shields/iron_shield.webp", def: 4, block: 1, dodge: 2, price: 90, shopTier: 2, desc: "Щит из холодного железа. Металл холодит руку и не подпускает нежить вплотную." },

  cold_iron_head: gearItem("cold_iron_head", "Шлем из холодного железа", "head", "assets/icons/armor/head/hide_head.png", 70, 2, { def: 4, hp: 45, dodge: 2, armorType: "leather" }, "Шлем из холодного железа холодит виски — и нежить обходит его стороной."),
  cold_iron_chest: gearItem("cold_iron_chest", "Нагрудник из холодного железа", "chest", "assets/icons/armor/chest/hide_chest.png", 120, 2, { def: 8, hp: 70, dodge: 1, armorType: "leather" }, "Нагрудник из холодного железа: лёгкий, холодный на ощупь и смертельно неприятный для нежити."),
  cold_iron_hands: gearItem("cold_iron_hands", "Перчатки из холодного железа", "hands", "assets/icons/armor/hands/hide_hands.png", 60, 2, { def: 4, hp: 40, dodge: 3, armorType: "leather" }, "Перчатки из холодного железа оставляют пальцы свободными для кирки, а металл стынет на коже."),
  cold_iron_feet: gearItem("cold_iron_feet", "Сапоги из холодного железа", "feet", "assets/icons/armor/feet/hide_feet.png", 70, 2, { def: 5, hp: 45, dodge: 3, armorType: "leather" }, "Сапоги из холодного железа: шаг тише, а нежить слышит его хуже."),

  cold_iron_ring: gearItem("cold_iron_ring", "Кольцо из холодного железа", "ring", "💍", 60, 2, { crit: 2 }, "Простое кольцо из холодного железа, отполированное до блеска. Нежить его не любит."),
  cold_iron_neck: gearItem("cold_iron_neck", "Амулет из холодного железа", "neck", "📿", 65, 2, { dodge: 2 }, "Амулет из холодного железа, чей тихий звон отводит беду и нежить."),
// === ITEMS: Сталь (этаж 3) ===

  steel_bulwark: { id: "steel_bulwark", name: "Стальной оплот", slot: "offhand", icon: "assets/icons/shields/iron_shield.webp", def: 6, block: 1, price: 180, shopTier: 3, desc: "Стальной щит, за которым можно переждать целый бой." },

  steel_head: gearItem("steel_head", "Стальной шлем", "head", "assets/icons/armor/head/coldsteel_plate_head.png", 150, 3, { def: 8, hp: 80, armorType: "plate" }, "Глухой стальной шлем, оставляющий лишь щель для глаз."),
  steel_chest: gearItem("steel_chest", "Стальная кираса", "chest", "assets/icons/armor/chest/coldsteel_plate_chest.png", 300, 3, { def: 14, hp: 120, armorType: "plate" }, "Тяжёлая стальная кираса, что глушит и удар, и страх."),
  steel_legs: gearItem("steel_legs", "Стальные поножи", "legs", "assets/icons/armor/legs/coldsteel_plate_legs.png", 240, 3, { def: 12, hp: 100, armorType: "plate" }, "Стальные поножи, в которых шаг становится гулким."),
  steel_feet: gearItem("steel_feet", "Стальные сапоги", "feet", "assets/icons/armor/feet/coldsteel_plate_feet.png", 200, 3, { def: 10, hp: 90, armorType: "plate" }, "Стальные сапоги, что вбивают врага в землю."),

  steel_ring: gearItem("steel_ring", "Стальное кольцо", "ring", "💍", 150, 3, { crit: 3 }, "Стальное кольцо, холодящее палец перед точным ударом."),
  steel_trinket: gearItem("steel_trinket", "Стальной талисман", "trinket", "🔮", 140, 3, { hp: 60 }, "Талисман из стали, дающий телу вторую прочность."),
// === ITEMS: Мифрил (этаж 4) ===

  mithril_shield: { id: "mithril_shield", name: "Мифриловый щит", slot: "offhand", icon: "assets/icons/shields/iron_shield.webp", def: 8, block: 2, price: 320, shopTier: 4, desc: "Мифриловый щит, лёгкий как перо и прочный как скала." },

  mithril_head: gearItem("mithril_head", "Мифриловый шлем", "head", "assets/icons/armor/head/runic_plate_head.png", 320, 4, { def: 12, hp: 100, crit: 2, armorType: "plate" }, "Мифриловый шлем, чьи грани ловят свет и чужой взгляд."),
  mithril_chest: gearItem("mithril_chest", "Кираса Оркского Вождя", "chest", "assets/icons/armor/chest/runic_plate_chest.png", 560, 4, { def: 16, hp: 130, crit: 3, armorType: "plate", rarity: "legendary", unique: "swift" }, "Кираса, снятая с павшего вождя орков: мифрил легче воздуха, а шаг в ней быстрее ветра."),
  mithril_hands: gearItem("mithril_hands", "Мифриловые рукавицы", "hands", "assets/icons/armor/hands/runic_plate_hands.png", 300, 4, { def: 12, hp: 100, crit: 3, armorType: "plate" }, "Мифриловые рукавицы, в которых пальцы точны до дрожи."),
  mithril_legs: gearItem("mithril_legs", "Мифриловые поножи", "legs", "assets/icons/armor/legs/runic_plate_legs.png", 420, 4, { def: 14, hp: 115, crit: 2, armorType: "plate" }, "Мифриловые поножи, что невесомы на ноге."),

  mithril_ring: gearItem("mithril_ring", "Мифриловое кольцо", "ring", "💍", 350, 4, { crit: 4 }, "Кольцо из мифрила, обострившее глаз до предела."),
  mithril_trinket: gearItem("mithril_trinket", "Мифриловый амулет", "trinket", "🔮", 340, 4, { crit: 3 }, "Мифриловый амулет, что шепчет, куда бить."),
// === ITEMS: Адский камень (этаж 5) ===

  hell_shield: { id: "hell_shield", name: "Щит из адского камня", slot: "offhand", icon: "assets/icons/shields/iron_shield.webp", def: 12, block: 2, dodge: -4, price: 600, shopTier: 5, desc: "Щит из адского камня — стена, за которой не спрячешься от жара." },

  hell_ring: gearItem("hell_ring", "Кольцо из адского камня", "ring", "💍", 550, 5, { crit: 4, hp: 30 }, "Кольцо из адского камня, что питает удар жизнью."),
  hell_trinket: gearItem("hell_trinket", "Амулет из адского камня", "trinket", "🔮", 580, 5, { crit: 3, hp: 50 }, "Амулет из адского камня, что делает тело крепче и удар точнее."),
// === ITEMS: Дневники охотников (выпадают из событий этажей, не продаются) ===
  diary_goblin: gearItem("diary_goblin", "Дневник новичка", "trinket", "📔", 0, 0, { hp: 10, crit: 1, lore: "День 3. Гоблины сбиваются в группы. Раньше их было по двое, теперь — по пять. Что-то их гонит сверху." }, "Потрёпанный блокнот с кривыми записями про жизнь в лесу."),
  diary_crypt: gearItem("diary_crypt", "Дневник ветерана", "trinket", "📕", 0, 0, { hp: 15, dodge: 1, lore: "Склеп не пуст. Кто-то ходит между саркофагами. Я слышал шаги, но никого не видел." }, "Осторожный почерк старого гробокопателя."),
  diary_hell: gearItem("diary_hell", "Дневник безумца", "trinket", "📗", 0, 0, { hp: 20, crit: 2, lore: "У Владыки есть слабое место. Не в броне — в самом сердце. Дробящий удар, точно в грудь. Запомни. Запомни. Запомни." }, "Записи, обожжённые по краям; последние страницы залиты воском."),
// === ITEMS: Сеты (Рудокоп / Страж склепа / Адский клинок) ===
  // — Рудокоп (холодное железо, leather, этаж 2) —
  set_miner_head: gearItem("set_miner_head", "Корона Глубинного Владыки", "head", "assets/icons/armor/head/hide_head.png", 90, 2, { def: 4, hp: 40, dodge: 2, armorType: "leather", rarity: "legendary", unique: "lucky" }, "Корона, вырезанная из кости древнего владыки глубин. Говорят, она приносит удачу своему носителю."),
  set_miner_chest: gearItem("set_miner_chest", "Мантия Подземного Короля", "chest", "assets/icons/armor/chest/hide_chest.png", 150, 2, { def: 8, hp: 70, dodge: 2, armorType: "leather", rarity: "legendary", unique: "lifesteal" }, "Мантия Подземного Короля, пропитанная рудной пылью и древней кровью. Она пьёт жизнь врагов, отдавая её владельцу."),
  set_miner_legs: gearItem("set_miner_legs", "Штаны рудокопа", "legs", "assets/icons/armor/legs/hide_pants.png", 120, 2, { def: 6, hp: 55, dodge: 3, armorType: "leather" }, "Штаны рудокопа, усиленные на коленях для долгой работы."),
  set_miner_hands: gearItem("set_miner_hands", "Перчатки рудокопа", "hands", "assets/icons/armor/hands/hide_hands.png", 80, 2, { def: 4, hp: 40, dodge: 4, armorType: "leather" }, "Перчатки рудокопа, в которых кирка не выскальзывает."),
  set_miner_feet: gearItem("set_miner_feet", "Сапоги рудокопа", "feet", "assets/icons/armor/feet/hide_feet.png", 90, 2, { def: 5, hp: 45, dodge: 4, armorType: "leather" }, "Сапоги рудокопа с подошвой, что держит на осыпи."),

  // — Страж склепа (сталь, plate, этаж 3) —
  set_guard_head: gearItem("set_guard_head", "Шлем стража склепа", "head", "assets/icons/armor/head/runic_plate_head.png", 180, 3, { def: 12, hp: 100, block: 1, armorType: "plate" }, "Шлем стража склепа, из-под которого не видно глаз."),
  set_guard_chest: gearItem("set_guard_chest", "Латы Вечного Стража", "chest", "assets/icons/armor/chest/runic_plate_chest.png", 360, 3, { def: 16, hp: 130, block: 1, armorType: "plate", rarity: "legendary", unique: "thorns" }, "Латы Вечного Стража, чьи шипы возвращают удар обидчику."),
  set_guard_legs: gearItem("set_guard_legs", "Поножи стража склепа", "legs", "assets/icons/armor/legs/runic_plate_legs.png", 280, 3, { def: 14, hp: 115, block: 1, armorType: "plate" }, "Поножи стража склепа, кованные для вечной стражи."),
  set_guard_hands: gearItem("set_guard_hands", "Рукавицы стража склепа", "hands", "assets/icons/armor/hands/runic_plate_hands.png", 220, 3, { def: 10, hp: 90, block: 1, armorType: "plate" }, "Рукавицы стража склепа, что держат клинок даже после смерти."),
  set_guard_feet: gearItem("set_guard_feet", "Сапоги стража склепа", "feet", "assets/icons/armor/feet/runic_plate_feet.webp", 240, 3, { def: 12, hp: 95, block: 1, armorType: "plate" }, "Сапоги стража склепа, что не скользят на могильных плитах."),

  // — Адский клинок (адский камень, plate, этаж 5) —
  set_hellblade_head: gearItem("set_hellblade_head", "Шлем адского клинка", "head", "assets/icons/armor/head/runic_plate_head.png", 700, 5, { def: 18, hp: 140, dodge: -4, crit: 3, armorType: "plate" }, "Шлем адского клинка, увенчанный рогами."),
  set_hellblade_chest: gearItem("set_hellblade_chest", "Кираса Пожирателя Душ", "chest", "assets/icons/armor/chest/runic_plate_chest.png", 950, 5, { def: 20, hp: 160, dodge: -4, crit: 4, armorType: "plate", rarity: "legendary", unique: "lifesteal" }, "Кираса Пожирателя Душ, что пьёт кровь врагов, даря силу своему носителю."),
  set_hellblade_legs: gearItem("set_hellblade_legs", "Поножи адского клинка", "legs", "assets/icons/armor/legs/runic_plate_legs.png", 820, 5, { def: 18, hp: 145, dodge: -3, crit: 3, armorType: "plate" }, "Поножи адского клинка, тяжёлые, как грехи их владельца."),
  set_hellblade_hands: gearItem("set_hellblade_hands", "Рукавицы адского клинка", "hands", "assets/icons/armor/hands/runic_plate_hands.png", 720, 5, { def: 16, hp: 120, dodge: -2, crit: 2, armorType: "plate" }, "Рукавицы адского клинка, что зажимают клинок до хруста."),
  set_hellblade_feet: gearItem("set_hellblade_feet", "Сапоги адского клинка", "feet", "assets/icons/armor/feet/runic_plate_feet.webp", 740, 5, { def: 16, hp: 125, dodge: -3, crit: 2, armorType: "plate" }, "Сапоги адского клинка, оставляющие в камне трещины."),

  // ══════════════════════════════════════════════════════════════════════════
  // БРОНЯ: 4 типа × 5 тиров × 8 слотов (20 сетов × 8 = 160 предметов)
  // iconFallback по слоту: 🪖 🛡️ 🧥 🧤 🧤 🎗️ 👖 🥾
  // ══════════════════════════════════════════════════════════════════════════

  // — Тир 1. «Грубая кольчуга» (chain, этаж 1): 7 недостающих слотов к iron_chainmail —
  set_rough_chain_head: gearItem("set_rough_chain_head", "Шлем грубой кольчуги", "head", "assets/icons/armor/head/iron_chain_head.png", 110, 1, { def: 3, hp: 22, armorType: "chain", iconFallback: "🪖" }, "Кольца нашиты на стёганую шапку. От стрелы убережёт, от топора — нет."),
  set_rough_chain_shoulder: gearItem("set_rough_chain_shoulder", "Наплечники грубой кольчуги", "shoulder", "assets/icons/armor/shoulders/iron_chain_shoulders.png", 105, 1, { def: 3, hp: 20, armorType: "chain", iconFallback: "🛡️" }, "Плечи в мелких кольцах, скрипящих при каждом взмахе."),
  set_rough_chain_wrist: gearItem("set_rough_chain_wrist", "Наручи грубой кольчуги", "wrist", "assets/icons/misc/iron_chain_wrists.png", 85, 1, { def: 2, hp: 18, armorType: "chain", iconFallback: "🧤" }, "Обрывок кольчужного рукава, стянутый ремешком."),
  set_rough_chain_hands: gearItem("set_rough_chain_hands", "Рукавицы грубой кольчуги", "hands", "assets/icons/armor/hands/iron_chain_hands.png", 85, 1, { def: 2, hp: 18, armorType: "chain", iconFallback: "🧤" }, "Пальцы в кольцах гнутся плохо, зато держат удар."),
  set_rough_chain_waist: gearItem("set_rough_chain_waist", "Пояс грубой кольчуги", "waist", "assets/icons/misc/iron_chain_waist.png", 80, 1, { def: 2, hp: 18, armorType: "chain", iconFallback: "🎗️" }, "Кольчужная юбка на ремне — прикрывает бёдра."),
  set_rough_chain_legs: gearItem("set_rough_chain_legs", "Поножи грубой кольчуги", "legs", "assets/icons/armor/legs/iron_chain_letgs.png", 120, 1, { def: 3, hp: 26, armorType: "chain", iconFallback: "👖" }, "Кольчужные чулки, тяжёлые и звонкие."),
  set_rough_chain_feet: gearItem("set_rough_chain_feet", "Сапоги грубой кольчуги", "feet", "assets/icons/armor/feet/iron_chain_feet.png", 105, 1, { def: 3, hp: 24, armorType: "chain", iconFallback: "🥾" }, "Кольчужные чулки вшиты в подошву — шаг гулкий."),

  // — Тир 2. «Сталь» (plate, этаж 2): 4 недостающих слота к steel_head/chest/legs/feet —
  steel_shoulder: gearItem("steel_shoulder", "Стальные наплечники", "shoulder", "assets/icons/armor/shoulders/coldsteel_plate_shoulders.png", 170, 2, { def: 7, hp: 45, dodge: -1, armorType: "plate", iconFallback: "🛡️" }, "Стальные пластины на плечах — весомый довод в споре."),
  steel_wrist: gearItem("steel_wrist", "Стальные наручи", "wrist", "assets/icons/misc/coldsteel_plate_wrists.png", 120, 2, { def: 6, hp: 40, dodge: -1, armorType: "plate", iconFallback: "🧤" }, "Кованые наручи с ремнями из сыромятной кожи."),
  steel_hands: gearItem("steel_hands", "Стальные рукавицы", "hands", "assets/icons/armor/hands/coldsteel_plate_hands.png", 120, 2, { def: 6, hp: 40, dodge: -1, armorType: "plate", iconFallback: "🧤" }, "Сталь на пальцах делает кулак кузнечным молотом."),
  steel_waist: gearItem("steel_waist", "Стальной пояс", "waist", "assets/icons/misc/coldsteel_plate_waist.png", 125, 2, { def: 6, hp: 42, dodge: -1, armorType: "plate", iconFallback: "🎗️" }, "Пластинчатый пояс, что держит спину прямой."),

  // — Тир 2. «Стальная кольчуга» (chain, этаж 2): 7 недостающих слотов к steel_chainmail —
  set_steel_chain_head: gearItem("set_steel_chain_head", "Шлем стальной кольчуги", "head", "assets/icons/armor/head/coldsteel_chain_head.png", 190, 2, { def: 7, hp: 45, armorType: "chain", iconFallback: "🪖" }, "Плотный кольчужный капюшон под стальным обручем."),
  set_steel_chain_shoulder: gearItem("set_steel_chain_shoulder", "Наплечники стальной кольчуги", "shoulder", "assets/icons/armor/shoulders/coldsteel_chain_shoulders.png", 185, 2, { def: 7, hp: 42, armorType: "chain", iconFallback: "🛡️" }, "Кольца ровного плетения — работа не спешная, но честная."),
  set_steel_chain_wrist: gearItem("set_steel_chain_wrist", "Наручи стальной кольчуги", "wrist", "assets/icons/misc/coldsteel_chain_wrists.png", 140, 2, { def: 5, hp: 38, armorType: "chain", iconFallback: "🧤" }, "Стальные наручи с двойным плетением на предплечье."),
  set_steel_chain_hands: gearItem("set_steel_chain_hands", "Рукавицы стальной кольчуги", "hands", "assets/icons/armor/hands/coldsteel_chain_hands.png", 140, 2, { def: 5, hp: 38, armorType: "chain", iconFallback: "🧤" }, "Кольчужные рукавицы, обшитые кожей по швам."),
  set_steel_chain_waist: gearItem("set_steel_chain_waist", "Пояс стальной кольчуги", "waist", "assets/icons/misc/coldsteel_chain_waist.png", 135, 2, { def: 5, hp: 38, armorType: "chain", iconFallback: "🎗️" }, "Кольчужная юбка до колен, тяжёлая и надёжная."),
  set_steel_chain_legs: gearItem("set_steel_chain_legs", "Поножи стальной кольчуги", "legs", "assets/icons/armor/legs/coldsteel_chain_pants.png", 230, 2, { def: 8, hp: 50, armorType: "chain", iconFallback: "👖" }, "Стальные кольчужные штаны — походка становится тяжёлой."),
  set_steel_chain_feet: gearItem("set_steel_chain_feet", "Сапоги стальной кольчуги", "feet", "assets/icons/armor/feet/coldsteel_chain_feet.png", 190, 2, { def: 7, hp: 45, armorType: "chain", iconFallback: "🥾" }, "Кольчуга до щиколоток, подошва — двойная кожа."),

  // — Тир 2. «Тёмная кожа» (leather, этаж 2): 3 недостающих слота к set_miner_* —
  set_miner_shoulder: gearItem("set_miner_shoulder", "Наплечники рудокопа", "shoulder", "assets/icons/armor/shoulders/hide_shoulders.png", 130, 2, { def: 6, hp: 45, dodge: 3, armorType: "leather", iconFallback: "🛡️" }, "Плечи рудокопа усилены кожей — туннель узкий, стены не уступают."),
  set_miner_wrist: gearItem("set_miner_wrist", "Наручи рудокопа", "wrist", "assets/icons/misc/hide_wrists.png", 105, 2, { def: 5, hp: 35, dodge: 4, armorType: "leather", iconFallback: "🧤" }, "Мягкие наручи, чтобы кирка не натирала запястье."),
  set_miner_waist: gearItem("set_miner_waist", "Пояс рудокопа", "waist", "assets/icons/misc/hide_belt.png", 110, 2, { def: 5, hp: 40, dodge: 3, armorType: "leather", iconFallback: "🎗️" }, "Ремень с карабинами для мешочков с рудой."),

  // — Тир 2. «Подмастерье» (cloth, этаж 2): 6 недостающих слотов к hood_mage/dense_cloth —
  set_apprentice_cloth_shoulder: gearItem("set_apprentice_cloth_shoulder", "Накидки подмастерья", "shoulder", "assets/icons/armor/shoulders/woolen_shoulders.png", 90, 2, { def: 2, hp: 30, mana: 12, armorType: "cloth", iconFallback: "🛡️" }, "Ткань, пропитанная травяным отваром, держит слабую магию."),
  set_apprentice_cloth_wrist: gearItem("set_apprentice_cloth_wrist", "Обмотки подмастерья", "wrist", "assets/icons/misc/woolen_wrists.png", 75, 2, { def: 2, hp: 30, mana: 10, armorType: "cloth", iconFallback: "🧤" }, "Обмотки с вышитыми знаками — пальцы не мёрзнут над колбой."),
  set_apprentice_cloth_hands: gearItem("set_apprentice_cloth_hands", "Перчатки подмастерья", "hands", "assets/icons/armor/hands/woolen_hands.png", 75, 2, { def: 2, hp: 30, mana: 10, armorType: "cloth", iconFallback: "🧤" }, "Тонкие перчатки, чтобы не оставить следов в зелье."),
  set_apprentice_cloth_waist: gearItem("set_apprentice_cloth_waist", "Пояс подмастерья", "waist", "assets/icons/misc/woolen_waist.png", 75, 2, { def: 2, hp: 30, mana: 10, armorType: "cloth", iconFallback: "🎗️" }, "Пояс с карманами для реагентов и мела."),
  set_apprentice_cloth_legs: gearItem("set_apprentice_cloth_legs", "Штаны подмастерья", "legs", "assets/icons/armor/legs/woolen_legs.png", 100, 2, { def: 3, hp: 35, mana: 15, armorType: "cloth", iconFallback: "👖" }, "Плотные штаны, хранящие запах дыма и пыли."),
  set_apprentice_cloth_feet: gearItem("set_apprentice_cloth_feet", "Тапочки подмастерья", "feet", "assets/icons/armor/feet/woolen_feet.png", 80, 2, { def: 2, hp: 30, mana: 10, armorType: "cloth", iconFallback: "🥾" }, "Мягкие тапочки — по библиотеке ходить тихо."),

  // — Тир 3. «Руническая сталь» (plate, этаж 3): 3 недостающих слота к set_guard_* —
  set_guard_shoulder: gearItem("set_guard_shoulder", "Наплечники стража склепа", "shoulder", "assets/icons/armor/shoulders/runic_plate_shoulders.png", 260, 3, { def: 12, hp: 80, block: 1, dodge: -1, armorType: "plate", iconFallback: "🛡️" }, "Руны на стали тускнеют, но не гаснут."),
  set_guard_wrist: gearItem("set_guard_wrist", "Наручи стража склепа", "wrist", "assets/icons/misc/runic_plate_wrists.png", 220, 3, { def: 10, hp: 78, block: 1, armorType: "plate", iconFallback: "🧤" }, "Наручи, что держали клинок крепче, чем память."),
  set_guard_waist: gearItem("set_guard_waist", "Пояс стража склепа", "waist", "assets/icons/misc/runic_plate_waist.png", 240, 3, { def: 10, hp: 79, block: 1, armorType: "plate", iconFallback: "🎗️" }, "Пластины пояса помнят каждый удар, что приняли."),

  // — Тир 3. «Руническая кольчуга» (chain, этаж 3) —
  set_runic_chain_head: gearItem("set_runic_chain_head", "Рунический кольчужный шлем", "head", "assets/icons/armor/head/runic_chain_head.png", 260, 3, { def: 11, hp: 75, armorType: "chain", iconFallback: "🪖" }, "Кольца переплетены в знак, что отводит взгляд нежити."),
  set_runic_chain_shoulder: gearItem("set_runic_chain_shoulder", "Рунические кольчужные наплечники", "shoulder", "assets/icons/armor/shoulders/runic_chain_shoulders.png", 250, 3, { def: 10, hp: 70, armorType: "chain", iconFallback: "🛡️" }, "Рунные кольца нашиты поверх обычного плетения."),
  set_runic_chain_chest: gearItem("set_runic_chain_chest", "Руническая кольчуга", "chest", "assets/icons/armor/chest/runic_chain_chest.png", 380, 3, { def: 13, hp: 80, armorType: "chain", iconFallback: "🧥" }, "Плотная кольчуга с рунными вставками на груди."),
  set_runic_chain_wrist: gearItem("set_runic_chain_wrist", "Рунические кольчужные наручи", "wrist", "assets/icons/misc/runic_chain_wrists.png", 200, 3, { def: 9, hp: 65, armorType: "chain", iconFallback: "🧤" }, "Мелкие руны на каждом третьем кольце."),
  set_runic_chain_hands: gearItem("set_runic_chain_hands", "Рунические кольчужные рукавицы", "hands", "assets/icons/armor/hands/runic_chain_hands.png", 200, 3, { def: 9, hp: 65, armorType: "chain", iconFallback: "🧤" }, "Кольчуга на пальцах не мешает держать клинок."),
  set_runic_chain_waist: gearItem("set_runic_chain_waist", "Рунический кольчужный пояс", "waist", "assets/icons/misc/runic_chain_waist.png", 195, 3, { def: 9, hp: 65, armorType: "chain", iconFallback: "🎗️" }, "Кольчужная юбка с рунным подолом."),
  set_runic_chain_legs: gearItem("set_runic_chain_legs", "Рунические кольчужные поножи", "legs", "assets/icons/armor/legs/runic_chain_legs.png", 320, 3, { def: 12, hp: 80, armorType: "chain", iconFallback: "👖" }, "Тяжёлые кольчужные штаны, звенящие на ходу."),
  set_runic_chain_feet: gearItem("set_runic_chain_feet", "Рунические кольчужные сапоги", "feet", "assets/icons/armor/feet/runic_chain_feet.png", 260, 3, { def: 10, hp: 70, armorType: "chain", iconFallback: "🥾" }, "Кольца до щиколоток, руны на подошве."),

  // — Тир 3. «Руническая кожа» (leather, этаж 3) —
  set_runic_leather_head: gearItem("set_runic_leather_head", "Рунический кожаный капюшон", "head", "assets/icons/armor/head/runic_leather_head.png", 240, 3, { def: 8, hp: 60, dodge: 4, armorType: "leather", iconFallback: "🪖" }, "Кожа, тиснённая рунами, глушит чужие шёпоты."),
  set_runic_leather_shoulder: gearItem("set_runic_leather_shoulder", "Рунические кожаные наплечники", "shoulder", "assets/icons/armor/shoulders/runic_leather_shoulders.png", 230, 3, { def: 8, hp: 55, dodge: 4, armorType: "leather", iconFallback: "🛡️" }, "Мягкая кожа с костяными вставками на плечах."),
  set_runic_leather_chest: gearItem("set_runic_leather_chest", "Рунический кожаный доспех", "chest", "assets/icons/armor/chest/runic_leather_chest.png", 350, 3, { def: 12, hp: 70, dodge: 3, armorType: "leather", iconFallback: "🧥" }, "Кожаный доспех, сшитый по рунным линиям."),
  set_runic_leather_wrist: gearItem("set_runic_leather_wrist", "Рунические кожаные наручи", "wrist", "assets/icons/misc/runic_leather_wrists.png", 180, 3, { def: 8, hp: 55, dodge: 4, armorType: "leather", iconFallback: "🧤" }, "Тонкая кожа, не стесняющая запястье."),
  set_runic_leather_hands: gearItem("set_runic_leather_hands", "Рунические кожаные перчатки", "hands", "assets/icons/armor/hands/runic_leather_hands.png", 180, 3, { def: 8, hp: 55, dodge: 4, armorType: "leather", iconFallback: "🧤" }, "Перчатки с рунной строчкой по костяшкам."),
  set_runic_leather_waist: gearItem("set_runic_leather_waist", "Рунический кожаный ремень", "waist", "assets/icons/misc/runic_leather_waist.png", 175, 3, { def: 8, hp: 55, dodge: 4, armorType: "leather", iconFallback: "🎗️" }, "Ремень с пряжкой, на которой стёрлась руна."),
  set_runic_leather_legs: gearItem("set_runic_leather_legs", "Рунические кожаные штаны", "legs", "assets/icons/armor/legs/runic_leather_legs.png", 300, 3, { def: 11, hp: 65, dodge: 3, armorType: "leather", iconFallback: "👖" }, "Кожаные штаны с вставками на коленях."),
  set_runic_leather_feet: gearItem("set_runic_leather_feet", "Рунические кожаные сапоги", "feet", "assets/icons/armor/feet/runic_leather_feet.png", 235, 3, { def: 9, hp: 60, dodge: 4, armorType: "leather", iconFallback: "🥾" }, "Мягкие сапоги — шаг тише, чем у страха."),

  // — Тир 3. «Адепт» (cloth, этаж 3) —
  set_adept_cloth_head: gearItem("set_adept_cloth_head", "Капюшон адепта", "head", "assets/icons/armor/head/runic_head.png", 235, 3, { def: 4, hp: 60, mana: 22, armorType: "cloth", iconFallback: "🪖" }, "Капюшон с вышитой печатью — мысли становятся тише."),
  set_adept_cloth_shoulder: gearItem("set_adept_cloth_shoulder", "Накидки адепта", "shoulder", "assets/icons/armor/shoulders/runic_shoulders.png", 220, 3, { def: 4, hp: 55, mana: 20, armorType: "cloth", iconFallback: "🛡️" }, "Слои ткани, держащие форму заклинания."),
  set_adept_cloth_chest: gearItem("set_adept_cloth_chest", "Роба адепта", "chest", "assets/icons/armor/chest/runic_chest.png", 340, 3, { def: 6, hp: 65, mana: 30, armorType: "cloth", iconFallback: "🧥" }, "Роба, в подкладку которой вшиты серебряные нити."),
  set_adept_cloth_wrist: gearItem("set_adept_cloth_wrist", "Обмотки адепта", "wrist", "assets/icons/misc/runic_wrists.png", 175, 3, { def: 4, hp: 50, mana: 18, armorType: "cloth", iconFallback: "🧤" }, "Обмотки с узлом на каждом витке — так учили."),
  set_adept_cloth_hands: gearItem("set_adept_cloth_hands", "Перчатки адепта", "hands", "assets/icons/armor/hands/runic_hands.webp", 175, 3, { def: 4, hp: 50, mana: 18, armorType: "cloth", iconFallback: "🧤" }, "Тонкие перчатки, в которых жест читается без слов."),
  set_adept_cloth_waist: gearItem("set_adept_cloth_waist", "Пояс адепта", "waist", "assets/icons/misc/runic_waist.png", 170, 3, { def: 4, hp: 50, mana: 18, armorType: "cloth", iconFallback: "🎗️" }, "Пояс с гнёздами для кристаллов."),
  set_adept_cloth_legs: gearItem("set_adept_cloth_legs", "Штаны адепта", "legs", "assets/icons/armor/legs/runic_legs.png", 290, 3, { def: 6, hp: 60, mana: 25, armorType: "cloth", iconFallback: "👖" }, "Плотная ткань, не мешающая шагу и жесту."),
  set_adept_cloth_feet: gearItem("set_adept_cloth_feet", "Сапоги адепта", "feet", "assets/icons/armor/feet/runic_feet.png", 225, 3, { def: 4, hp: 55, mana: 20, armorType: "cloth", iconFallback: "🥾" }, "Сапоги с войлочной подкладкой — в склепе не холодно."),

  // — Тир 4. «Мифрил» (plate, этаж 4): 4 недостающих слота к mithril_head/chest/hands/legs —
  mithril_shoulder: gearItem("mithril_shoulder", "Мифриловые наплечники", "shoulder", "assets/icons/armor/shoulders/runic_plate_shoulders.png", 300, 4, { def: 14, hp: 105, crit: 1, dodge: -1, armorType: "plate", iconFallback: "🛡️" }, "Мифрил почти невесом — плечи не устают до вечера."),
  mithril_wrist: gearItem("mithril_wrist", "Мифриловые наручи", "wrist", "assets/icons/misc/runic_plate_wrists.png", 260, 4, { def: 12, hp: 95, crit: 1, armorType: "plate", iconFallback: "🧤" }, "Мифриловые наручи гнутся там, где сталь бы лопнула."),
  mithril_waist: gearItem("mithril_waist", "Мифриловый пояс", "waist", "assets/icons/misc/runic_plate_waist.png", 270, 4, { def: 12, hp: 100, crit: 1, armorType: "plate", iconFallback: "🎗️" }, "Пояс, отлитый из одного куска мифрила."),
  mithril_feet: gearItem("mithril_feet", "Мифриловые сапоги", "feet", "assets/icons/armor/feet/runic_plate_feet.webp", 310, 4, { def: 14, hp: 110, crit: 1, armorType: "plate", iconFallback: "🥾" }, "Мифриловые сапоги: тихий шаг, гулкий удар."),

  // — Тир 4. «Мифриловая кольчуга» (chain, этаж 4) —
  set_mithril_chain_head: gearItem("set_mithril_chain_head", "Мифриловый кольчужный шлем", "head", "assets/icons/armor/head/runic_chain_head.png", 380, 4, { def: 13, hp: 100, crit: 2, armorType: "chain", iconFallback: "🪖" }, "Мифриловая сетка под стальным обручем — легче шёпота."),
  set_mithril_chain_shoulder: gearItem("set_mithril_chain_shoulder", "Мифриловые кольчужные наплечники", "shoulder", "assets/icons/armor/shoulders/runic_chain_shoulders.png", 360, 4, { def: 12, hp: 95, crit: 1, armorType: "chain", iconFallback: "🛡️" }, "Кольца мифрила блестят даже в темноте склепа."),
  set_mithril_chain_chest: gearItem("set_mithril_chain_chest", "Мифриловая кольчуга", "chest", "assets/icons/armor/chest/runic_chain_chest.png", 620, 4, { def: 16, hp: 120, crit: 3, armorType: "chain", iconFallback: "🧥" }, "Мифриловая кольчуга, что поёт под ударом."),
  set_mithril_chain_wrist: gearItem("set_mithril_chain_wrist", "Мифриловые кольчужные наручи", "wrist", "assets/icons/misc/runic_chain_wrists.png", 270, 4, { def: 12, hp: 90, crit: 1, armorType: "chain", iconFallback: "🧤" }, "Плетение такой плотности, что вода не проходит."),
  set_mithril_chain_hands: gearItem("set_mithril_chain_hands", "Мифриловые кольчужные рукавицы", "hands", "assets/icons/armor/hands/runic_chain_hands.png", 300, 4, { def: 12, hp: 90, crit: 2, armorType: "chain", iconFallback: "🧤" }, "Пальцы в мифриле чувствуют биение чужой крови."),
  set_mithril_chain_waist: gearItem("set_mithril_chain_waist", "Мифриловый кольчужный пояс", "waist", "assets/icons/misc/runic_chain_waist.png", 275, 4, { def: 12, hp: 90, crit: 1, armorType: "chain", iconFallback: "🎗️" }, "Кольчужная юбка из мифрила — звенит, но не тянет."),
  set_mithril_chain_legs: gearItem("set_mithril_chain_legs", "Мифриловые кольчужные поножи", "legs", "assets/icons/armor/legs/runic_chain_legs.png", 480, 4, { def: 15, hp: 110, crit: 2, armorType: "chain", iconFallback: "👖" }, "Лёгкие поножи, в которых можно бежать по осыпи."),
  set_mithril_chain_feet: gearItem("set_mithril_chain_feet", "Мифриловые кольчужные сапоги", "feet", "assets/icons/armor/feet/runic_chain_feet.png", 380, 4, { def: 13, hp: 100, crit: 2, armorType: "chain", iconFallback: "🥾" }, "Мифриловая сетка на подошве — шаг как у кошки."),

  // — Тир 4. «Кожа с костяными пластинами» (leather, этаж 4) —
  set_bone_leather_head: gearItem("set_bone_leather_head", "Шлем из костяной кожи", "head", "assets/icons/armor/head/runic_leather_head.png", 340, 4, { def: 12, hp: 90, dodge: 4, armorType: "leather", iconFallback: "🪖" }, "Костяные пластины вшиты в кожу, как рёбра в плоть."),
  set_bone_leather_shoulder: gearItem("set_bone_leather_shoulder", "Костяные наплечники", "shoulder", "assets/icons/armor/shoulders/runic_leather_shoulders.png", 320, 4, { def: 12, hp: 85, dodge: 4, armorType: "leather", iconFallback: "🛡️" }, "Оркские клыки держат кожу на плечах."),
  set_bone_leather_chest: gearItem("set_bone_leather_chest", "Костяная кираса", "chest", "assets/icons/armor/chest/runic_leather_chest.png", 600, 4, { def: 16, hp: 105, dodge: 3, armorType: "leather", iconFallback: "🧥" }, "Кираса из кожи и рёбер — гнётся там, где сталь звенит."),
  set_bone_leather_wrist: gearItem("set_bone_leather_wrist", "Костяные наручи", "wrist", "assets/icons/misc/runic_leather_wrists.png", 250, 4, { def: 12, hp: 80, dodge: 4, armorType: "leather", iconFallback: "🧤" }, "Наручи с костяными шипами на внешней стороне."),
  set_bone_leather_hands: gearItem("set_bone_leather_hands", "Костяные перчатки", "hands", "assets/icons/armor/hands/runic_leather_hands.png", 250, 4, { def: 12, hp: 80, dodge: 4, armorType: "leather", iconFallback: "🧤" }, "Костяные пластины на костяшках — удар тяжелее."),
  set_bone_leather_waist: gearItem("set_bone_leather_waist", "Костяной ремень", "waist", "assets/icons/misc/runic_leather_waist.png", 255, 4, { def: 12, hp: 80, dodge: 4, armorType: "leather", iconFallback: "🎗️" }, "Ремень, увешанный костяными пластинами."),
  set_bone_leather_legs: gearItem("set_bone_leather_legs", "Костяные штаны", "legs", "assets/icons/armor/legs/runic_leather_legs.png", 450, 4, { def: 15, hp: 100, dodge: 3, armorType: "leather", iconFallback: "👖" }, "Кожаные штаны с костяными наколенниками."),
  set_bone_leather_feet: gearItem("set_bone_leather_feet", "Костяные сапоги", "feet", "assets/icons/armor/feet/runic_leather_feet.png", 350, 4, { def: 13, hp: 90, dodge: 4, armorType: "leather", iconFallback: "🥾" }, "Сапоги с костяной стелькой — по камню идти легче."),

  // — Тир 4. «Маг» (cloth, этаж 4) —
  set_mage_cloth_head: gearItem("set_mage_cloth_head", "Капюшон мага", "head", "assets/icons/armor/head/runic_head.png", 330, 4, { def: 7, hp: 85, mana: 30, armorType: "cloth", iconFallback: "🪖" }, "Капюшон мага хранит чужие заклятия, как ткань — дым."),
  set_mage_cloth_shoulder: gearItem("set_mage_cloth_shoulder", "Накидка мага", "shoulder", "assets/icons/armor/shoulders/runic_shoulders.png", 305, 4, { def: 7, hp: 80, mana: 28, armorType: "cloth", iconFallback: "🛡️" }, "Накидка, расшитая созвездиями чужого неба."),
  set_mage_cloth_chest: gearItem("set_mage_cloth_chest", "Мантия мага", "chest", "assets/icons/armor/chest/runic_chest.png", 580, 4, { def: 9, hp: 90, mana: 40, armorType: "cloth", iconFallback: "🧥" }, "Мантия мага: ткань легче, чем кажется, и тёплее, чем должна."),
  set_mage_cloth_wrist: gearItem("set_mage_cloth_wrist", "Наручи мага", "wrist", "assets/icons/misc/runic_wrists.png", 235, 4, { def: 7, hp: 80, mana: 25, armorType: "cloth", iconFallback: "🧤" }, "Наручи с кристальной иглой, что не даёт жесту дрожать."),
  set_mage_cloth_hands: gearItem("set_mage_cloth_hands", "Перчатки мага", "hands", "assets/icons/armor/hands/runic_hands.webp", 235, 4, { def: 7, hp: 80, mana: 25, armorType: "cloth", iconFallback: "🧤" }, "Ткань перчаток помнит тепло последнего заклинания."),
  set_mage_cloth_waist: gearItem("set_mage_cloth_waist", "Пояс мага", "waist", "assets/icons/misc/runic_waist.png", 240, 4, { def: 7, hp: 80, mana: 25, armorType: "cloth", iconFallback: "🎗️" }, "Пояс с ячейками для свитков."),
  set_mage_cloth_legs: gearItem("set_mage_cloth_legs", "Штаны мага", "legs", "assets/icons/armor/legs/runic_legs.png", 440, 4, { def: 9, hp: 85, mana: 32, armorType: "cloth", iconFallback: "👖" }, "Штаны, подшитые нитью, что не рвётся от жара."),
  set_mage_cloth_feet: gearItem("set_mage_cloth_feet", "Сапоги мага", "feet", "assets/icons/armor/feet/runic_feet.png", 330, 4, { def: 7, hp: 85, mana: 28, armorType: "cloth", iconFallback: "🥾" }, "Сапоги с пылью, что не оседает на подошве."),

  // — Тир 5. «Бездна» (plate, этаж 5): 3 недостающих слота к set_hellblade_* —
  set_hellblade_shoulder: gearItem("set_hellblade_shoulder", "Наплечники адского клинка", "shoulder", "assets/icons/armor/shoulders/runic_plate_shoulders.png", 780, 5, { def: 18, hp: 140, dodge: -4, crit: 3, armorType: "plate", iconFallback: "🛡️" }, "Шипы наплечников тлеют даже под дождём."),
  set_hellblade_wrist: gearItem("set_hellblade_wrist", "Наручи адского клинка", "wrist", "assets/icons/misc/runic_plate_wrists.png", 700, 5, { def: 16, hp: 115, dodge: -2, crit: 2, armorType: "plate", iconFallback: "🧤" }, "Наручи, что жгут холодом, а не жаром."),
  set_hellblade_waist: gearItem("set_hellblade_waist", "Пояс адского клинка", "waist", "assets/icons/misc/runic_plate_waist.png", 720, 5, { def: 16, hp: 120, dodge: -3, crit: 2, armorType: "plate", iconFallback: "🎗️" }, "Пластины пояса скреплены цепью из Бездны."),

  // — Тир 5. «Кольчуга Бездны» (chain, этаж 5) —
  set_abyss_chain_head: gearItem("set_abyss_chain_head", "Кольчужный шлем Бездны", "head", "assets/icons/armor/head/runic_chain_head.png", 700, 5, { def: 17, hp: 130, armorType: "chain", iconFallback: "🪖" }, "Кольца плавятся и снова твердеют — но не рвутся."),
  set_abyss_chain_shoulder: gearItem("set_abyss_chain_shoulder", "Кольчужные наплечники Бездны", "shoulder", "assets/icons/armor/shoulders/runic_chain_shoulders.png", 670, 5, { def: 16, hp: 120, armorType: "chain", iconFallback: "🛡️" }, "Тёмные кольца, что не блестят даже в огне."),
  set_abyss_chain_chest: gearItem("set_abyss_chain_chest", "Кольчуга Бездны", "chest", "assets/icons/armor/chest/runic_chain_chest.png", 900, 5, { def: 20, hp: 150, armorType: "chain", iconFallback: "🧥" }, "Кольчуга Бездны: холодная, тяжёлая, чужая."),
  set_abyss_chain_wrist: gearItem("set_abyss_chain_wrist", "Кольчужные наручи Бездны", "wrist", "assets/icons/misc/runic_chain_wrists.png", 560, 5, { def: 15, hp: 105, armorType: "chain", iconFallback: "🧤" }, "Кольца наручей шепчут чужими голосами."),
  set_abyss_chain_hands: gearItem("set_abyss_chain_hands", "Кольчужные рукавицы Бездны", "hands", "assets/icons/armor/hands/runic_chain_hands.png", 570, 5, { def: 15, hp: 105, armorType: "chain", iconFallback: "🧤" }, "Рукавицы, в которых клинок держится сам."),
  set_abyss_chain_waist: gearItem("set_abyss_chain_waist", "Кольчужный пояс Бездны", "waist", "assets/icons/misc/runic_chain_waist.png", 580, 5, { def: 15, hp: 105, armorType: "chain", iconFallback: "🎗️" }, "Пояс, к которому липнет пепел."),
  set_abyss_chain_legs: gearItem("set_abyss_chain_legs", "Кольчужные поножи Бездны", "legs", "assets/icons/armor/legs/runic_chain_legs.png", 800, 5, { def: 18, hp: 140, armorType: "chain", iconFallback: "👖" }, "Поножи Бездны: каждый шаг — как по углям."),
  set_abyss_chain_feet: gearItem("set_abyss_chain_feet", "Кольчужные сапоги Бездны", "feet", "assets/icons/armor/feet/runic_chain_feet.png", 680, 5, { def: 16, hp: 125, armorType: "chain", iconFallback: "🥾" }, "Сапоги, что не плавятся на раскалённом камне."),

  // — Тир 5. «Кожа Бездны» (leather, этаж 5) —
  set_abyss_leather_head: gearItem("set_abyss_leather_head", "Кожаный шлем Бездны", "head", "assets/icons/armor/head/runic_leather_head.png", 640, 5, { def: 15, hp: 105, dodge: 5, armorType: "leather", iconFallback: "🪖" }, "Кожа, снятая с чего-то, что не имело имени."),
  set_abyss_leather_shoulder: gearItem("set_abyss_leather_shoulder", "Кожаные наплечники Бездны", "shoulder", "assets/icons/armor/shoulders/runic_leather_shoulders.png", 610, 5, { def: 15, hp: 100, dodge: 5, armorType: "leather", iconFallback: "🛡️" }, "Наплечники, что двигаются вместе с тенью."),
  set_abyss_leather_chest: gearItem("set_abyss_leather_chest", "Кожаный доспех Бездны", "chest", "assets/icons/armor/chest/runic_leather_chest.png", 850, 5, { def: 17, hp: 115, dodge: 4, armorType: "leather", iconFallback: "🧥" }, "Доспех Бездны: кожа теплее воздуха и тише шага."),
  set_abyss_leather_wrist: gearItem("set_abyss_leather_wrist", "Кожаные наручи Бездны", "wrist", "assets/icons/misc/runic_leather_wrists.png", 520, 5, { def: 15, hp: 100, dodge: 5, armorType: "leather", iconFallback: "🧤" }, "Наручи с прожилками, что светятся в темноте."),
  set_abyss_leather_hands: gearItem("set_abyss_leather_hands", "Кожаные перчатки Бездны", "hands", "assets/icons/armor/hands/runic_leather_hands.png", 520, 5, { def: 15, hp: 100, dodge: 5, armorType: "leather", iconFallback: "🧤" }, "Перчатки, в которых пальцы не чувствуют жара."),
  set_abyss_leather_waist: gearItem("set_abyss_leather_waist", "Кожаный ремень Бездны", "waist", "assets/icons/misc/runic_leather_waist.png", 530, 5, { def: 15, hp: 100, dodge: 5, armorType: "leather", iconFallback: "🎗️" }, "Ремень, стянутый пряжкой из чёрного камня."),
  set_abyss_leather_legs: gearItem("set_abyss_leather_legs", "Кожаные штаны Бездны", "legs", "assets/icons/armor/legs/runic_leather_legs.png", 750, 5, { def: 17, hp: 110, dodge: 4, armorType: "leather", iconFallback: "👖" }, "Штаны, что не пропускают ни жар, ни холод."),
  set_abyss_leather_feet: gearItem("set_abyss_leather_feet", "Кожаные сапоги Бездны", "feet", "assets/icons/armor/feet/runic_leather_feet.png", 620, 5, { def: 15, hp: 105, dodge: 5, armorType: "leather", iconFallback: "🥾" }, "Сапоги, оставляющие следы, что остывают медленно."),

  // — Тир 5. «Архимаг» (cloth, этаж 5) —
  set_archmage_cloth_head: gearItem("set_archmage_cloth_head", "Капюшон архимага", "head", "assets/icons/armor/head/runic_head.png", 610, 5, { def: 9, hp: 105, mana: 40, armorType: "cloth", iconFallback: "🪖" }, "Капюшон архимага: под тканью — звёздная пустота."),
  set_archmage_cloth_shoulder: gearItem("set_archmage_cloth_shoulder", "Накидка архимага", "shoulder", "assets/icons/armor/shoulders/runic_shoulders.png", 570, 5, { def: 9, hp: 100, mana: 38, armorType: "cloth", iconFallback: "🛡️" }, "Накидка, что гасит искры заклинаний."),
  set_archmage_cloth_chest: gearItem("set_archmage_cloth_chest", "Мантия архимага", "chest", "assets/icons/armor/chest/runic_chest.png", 860, 5, { def: 11, hp: 110, mana: 50, armorType: "cloth", iconFallback: "🧥" }, "Мантия архимага помнит всех, кто её носил. И всех, кто нет."),
  set_archmage_cloth_wrist: gearItem("set_archmage_cloth_wrist", "Наручи архимага", "wrist", "assets/icons/misc/runic_wrists.png", 480, 5, { def: 9, hp: 100, mana: 35, armorType: "cloth", iconFallback: "🧤" }, "Наручи с печатями, что нельзя прочесть дважды."),
  set_archmage_cloth_hands: gearItem("set_archmage_cloth_hands", "Перчатки архимага", "hands", "assets/icons/armor/hands/runic_hands.webp", 490, 5, { def: 9, hp: 100, mana: 35, armorType: "cloth", iconFallback: "🧤" }, "Перчатки, в которых жест стоит дороже золота."),
  set_archmage_cloth_waist: gearItem("set_archmage_cloth_waist", "Пояс архимага", "waist", "assets/icons/misc/runic_waist.png", 500, 5, { def: 9, hp: 100, mana: 35, armorType: "cloth", iconFallback: "🎗️" }, "Пояс, к которому прикованы пустые ножны для свитков."),
  set_archmage_cloth_legs: gearItem("set_archmage_cloth_legs", "Штаны архимага", "legs", "assets/icons/armor/legs/runic_legs.png", 760, 5, { def: 11, hp: 105, mana: 45, armorType: "cloth", iconFallback: "👖" }, "Штаны, подол которых не касается пола."),
  set_archmage_cloth_feet: gearItem("set_archmage_cloth_feet", "Сапоги архимага", "feet", "assets/icons/armor/feet/runic_feet.png", 600, 5, { def: 9, hp: 105, mana: 40, armorType: "cloth", iconFallback: "🥾" }, "Сапоги архимага ступают бесшумно по любому камню."),

  // ══════════════════════════════════════════════════════════════════════════
  // ПАРНЫЕ КОЛЬЦА И АКСЕССУАРЫ: 10 пар = 20 предметов (порог 2/2)
  // ══════════════════════════════════════════════════════════════════════════

  // — Тир 1: железные кольца и тотемы волка —
  ring_iron_1: gearItem("ring_iron_1", "Железное кольцо «Заря»", "ring", "assets/icons/ring_iron_1.webp", 35, 1, { crit: 1, iconFallback: "💍" }, "Пара к кольцу «Закат»: вместе они точнее находят щель в броне."),
  ring_iron_2: gearItem("ring_iron_2", "Железное кольцо «Закат»", "ring", "assets/icons/ring_iron_2.webp", 35, 1, { crit: 1, iconFallback: "💍" }, "Пара к кольцу «Заря»: холодный металл помнит чужой удар."),
  trinket_wolf_1: gearItem("trinket_wolf_1", "Тотем волка «Клык»", "trinket", "assets/icons/trinket_wolf_1.webp", 32, 1, { dodge: 1, iconFallback: "🔮" }, "Волчий клык на жиле — шаг становится мягче."),
  trinket_wolf_2: gearItem("trinket_wolf_2", "Тотем волка «Лапа»", "trinket", "assets/icons/trinket_wolf_2.webp", 32, 1, { dodge: 1, iconFallback: "🔮" }, "Лапа, высушенная в дыму: пара к тотему «Клык»."),

  // — Тир 2: медные кольца и грибные амулеты —
  ring_copper_1: gearItem("ring_copper_1", "Медное кольцо «Искра»", "ring", "assets/icons/ring_copper_1.webp", 70, 2, { crit: 1, iconFallback: "💍" }, "Медь под шахтным светом кажется золотом."),
  ring_copper_2: gearItem("ring_copper_2", "Медное кольцо «Жар»", "ring", "assets/icons/ring_copper_2.webp", 85, 2, { crit: 2, iconFallback: "💍" }, "Пара к «Искре»: вместе они держат удар точнее."),
  trinket_mushroom_1: gearItem("trinket_mushroom_1", "Грибной амулет «Бледный»", "trinket", "assets/icons/trinket_mushroom_1.webp", 68, 2, { hp: 10, iconFallback: "🔮" }, "Пещерный гриб в смоле: дышится легче."),
  trinket_mushroom_2: gearItem("trinket_mushroom_2", "Грибной амулет «Тёмный»", "trinket", "assets/icons/trinket_mushroom_2.webp", 76, 2, { hp: 15, iconFallback: "🔮" }, "Пара к «Бледному»: вместе они греют изнутри."),

  // — Тир 3: серебряные кольца и фиалы призрака —
  ring_silver_1: gearItem("ring_silver_1", "Серебряное кольцо «Луна»", "ring", "assets/icons/ring_silver_1.webp", 130, 3, { dodge: 2, iconFallback: "💍" }, "Холодное серебро отводит чужой взгляд."),
  ring_silver_2: gearItem("ring_silver_2", "Серебряное кольцо «Тень»", "ring", "assets/icons/ring_silver_2.webp", 130, 3, { dodge: 2, iconFallback: "💍" }, "Пара к «Луне»: вместе они делают шаг неслышным."),
  trinket_ghost_1: gearItem("trinket_ghost_1", "Фиал призрака «Шёпот»", "trinket", "assets/icons/trinket_ghost_1.webp", 140, 3, { hp: 20, iconFallback: "🔮" }, "В фиале плещется чужое дыхание — оно держит тебя на ногах."),
  trinket_ghost_2: gearItem("trinket_ghost_2", "Фиал призрака «Холод»", "trinket", "assets/icons/trinket_ghost_2.webp", 140, 3, { hp: 20, iconFallback: "🔮" }, "Пара к «Шёпоту»: вместе они выстуживают чужой удар."),

  // — Тир 4: мифриловые кольца и амулеты орка —
  ring_mithril_1: gearItem("ring_mithril_1", "Мифриловое кольцо «Блеск»", "ring", "assets/icons/ring_mithril_1.webp", 330, 4, { crit: 3, iconFallback: "💍" }, "Мифрил ловит свет и подсказывает, куда бить."),
  ring_mithril_2: gearItem("ring_mithril_2", "Мифриловое кольцо «Песнь»", "ring", "assets/icons/ring_mithril_2.webp", 330, 4, { crit: 3, iconFallback: "💍" }, "Пара к «Блеску»: вместе они поют перед ударом."),
  trinket_orc_1: gearItem("trinket_orc_1", "Амулет орка «Череп»", "trinket", "assets/icons/trinket_orc_1.webp", 330, 4, { dodge: 2, iconFallback: "🔮" }, "Оркский череп, обвязанный цепью, — враг промахивается чаще."),
  trinket_orc_2: gearItem("trinket_orc_2", "Амулет орка «Клык»", "trinket", "assets/icons/trinket_orc_2.webp", 330, 4, { dodge: 2, iconFallback: "🔮" }, "Пара к «Черепу»: вместе они пахнут войной."),

  // — Тир 5: кольца из адского камня и печати демона —
  ring_hell_1: gearItem("ring_hell_1", "Кольцо из адского камня «Уголёк»", "ring", "assets/icons/ring_hell_1.webp", 540, 5, { crit: 4, iconFallback: "💍" }, "Уголёк в оправе не гаснет — он ждёт удара."),
  ring_hell_2: gearItem("ring_hell_2", "Кольцо из адского камня «Пламя»", "ring", "assets/icons/ring_hell_2.webp", 540, 5, { crit: 4, iconFallback: "💍" }, "Пара к «Угольку»: вместе они разжигают кровь."),
  trinket_demon_1: gearItem("trinket_demon_1", "Печать демона «Зола»", "trinket", "assets/icons/trinket_demon_1.webp", 560, 5, { hp: 30, iconFallback: "🔮" }, "Печать, оттиснутая на пепле: тело помнит, что уже горело."),
  trinket_demon_2: gearItem("trinket_demon_2", "Печать демона «Уголь»", "trinket", "assets/icons/trinket_demon_2.webp", 560, 5, { hp: 30, iconFallback: "🔮" }, "Пара к «Золе»: вместе они держат душу в теле."),
};

// armorType старой gearItem()-брони (голова/плечи/спина/руки/пояс/ноги/ступни).
const ARMOR_TYPE_BY_ID = {
  worn_hood: "cloth", patched_pants: "cloth", worn_boots: "cloth",
  head_cloth: "cloth", head_iron: "plate", head_crystal: "plate",
  shoulder_leather: "leather", shoulder_iron: "plate", shoulder_crystal: "plate",
  back_cloak: "cloth", back_guard: "cloth", back_crystal: "plate",
  wrist_leather: "leather", wrist_chain: "chain", wrist_crystal: "plate",
  hands_gloves: "leather", hands_iron: "plate", hands_crystal: "plate",
  waist_rope: "cloth", waist_plate: "plate", waist_crystal: "plate",
  legs_leather: "leather", legs_chain: "chain", legs_crystal: "plate",
  feet_leather: "leather", feet_iron: "plate", feet_crystal: "plate",
};
for (const [id, armorType] of Object.entries(ARMOR_TYPE_BY_ID)) {
  if (ITEMS[id] && !ITEMS[id].armorType) ITEMS[id].armorType = armorType;
}

function shopFloorFor(item) {
  return Math.max(1, Math.min(5, item.shopTier || 1));
}

// ── Сундуки (Гача) ─────────────────────────────────────────────────────────
// Прокрутка отдельного сундука: rolls попыток, каждая — ресурсы (70%/30%/40%/60%
// снаряжение против редкости наименее открытого сундука по: обычный 30/70,
// элитный 45/55, бездны 60/40). Снаряжение ограничено state.maxFloor
// (shopTier предмета не выше достигнутого этажа).
const CHEST_TYPES = {
  common: { name: "Обычный сундук", icon: "📦", rolls: 1, rarityBonus: 0.05, maxRarity: "rare" },
  elite:  { name: "Элитный сундук", icon: "🎁", rolls: 1, rarityBonus: 0.15, maxRarity: "epic" },
  abyss:  { name: "Сундук Бездны", icon: "🧰", rolls: 1, rarityBonus: 0.30, maxRarity: "legendary", legendaryChance: 0.02 },
};
const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary"];
const CHEST_SCRAP_COST = { rust: 50, cloth: 50 }; // 100 базовых ресурсов → 1 common
const CHEST_TRADER = { name: "Запечатанный ларец", icon: "📦", price: 500 };

// Урон оружия по стилям (без оружия — кулаки). Экземпляр оружия передаётся
// явно из боя/UI, чтобы редкость влияла на damage без глобального состояния.
function weaponDamageFor(weapon, inst = null) {
  if (!weapon) return UNARMED_DAMAGE;
  if (!weapon.damage) return UNARMED_DAMAGE;
  if (inst && ITEMS[inst.id] === weapon) {
    const scaled = getInstanceStats(inst).damage;
    if (scaled) return scaled;
  }
  return weapon.damage;
}
function weaponStyleValue(weapon, style, inst = null) { return weaponDamageFor(weapon, inst)[style] || 0; }
// Множитель стиля: лучший стиль оружия = 1.0, слабые 0.55–1.0, ноль = не бьёт.
function weaponStyleMult(weapon, style, inst = null) {
  const d = weaponDamageFor(weapon, inst);
  const v = d[style] || 0;
  if (v <= 0) return 0;
  const best = Math.max(d.slashing, d.piercing, d.bludgeoning, 1);
  return 0.55 + 0.45 * (v / best);
}
// Сильнейший стиль оружия (для подписи «Вооружен: … (Колющий)»).
function weaponBestStyle(weapon, inst = null) {
  const d = weaponDamageFor(weapon, inst);
  return STYLE_ORDER.reduce((acc, s) => (d[s] > d[acc] ? s : acc), "slashing");
}

const RECIPES = [
  // ── ОРУЖИЕ: 27 предметов (только материалы своего этажа) ──
  // Тир 1 «Железо» (этаж 1)
  { id: "recipe_iron_long_sword", station: "forge", result: "iron_long_sword", desc: "Железный длинный меч", floor: 1, dropChance: 0.05, materials: { iron_ore: 6, wood: 2, leather: 1 } },
  { id: "recipe_iron_short_sword", station: "forge", result: "iron_short_sword", desc: "Железный короткий меч", floor: 1, dropChance: 0.05, materials: { iron_ore: 4, wood: 1, leather: 1 } },
  { id: "recipe_iron_rapier", station: "forge", result: "iron_rapier", desc: "Железная рапира", floor: 1, dropChance: 0.05, materials: { iron_ore: 4, wood: 1, rust: 2 } },
  { id: "recipe_iron_hatchet", station: "forge", result: "iron_hatchet", desc: "Железный топорик", floor: 1, dropChance: 0.05, materials: { iron_ore: 2, wood: 4, rust: 2 } },
  { id: "recipe_iron_great_axe", station: "forge", result: "iron_great_axe", desc: "Железная секира", floor: 1, dropChance: 0.05, materials: { iron_ore: 6, wood: 4, leather: 1 } },
  { id: "recipe_iron_mace", station: "forge", result: "iron_mace", desc: "Железная булава", floor: 1, dropChance: 0.05, materials: { iron_ore: 5, wood: 2 } },
  { id: "recipe_iron_maul", station: "forge", result: "iron_maul", desc: "Железный молот", floor: 1, dropChance: 0.05, materials: { iron_ore: 8, wood: 4 } },
  { id: "recipe_iron_spear", station: "forge", result: "iron_spear", desc: "Железное копьё", floor: 1, dropChance: 0.05, materials: { iron_ore: 4, wood: 5 } },
  { id: "recipe_iron_great_sword", station: "forge", result: "iron_great_sword", desc: "Железный двуручный меч", floor: 1, dropChance: 0.05, materials: { iron_ore: 9, wood: 3, leather: 2 } },
  // Тир 2 «Хладосталь» (этаж 2)
  { id: "recipe_coldsteel_long_sword", station: "forge", result: "coldsteel_long_sword", desc: "Длинный меч из хладостали", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 4, steel: 2, leather: 1 } },
  { id: "recipe_coldsteel_short_sword", station: "forge", result: "coldsteel_short_sword", desc: "Короткий меч из хладостали", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 3, steel: 1, leather: 1 } },
  { id: "recipe_coldsteel_rapier", station: "forge", result: "coldsteel_rapier", desc: "Рапира из хладостали", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 3, tin_ore: 2, leather: 1 } },
  { id: "recipe_coldsteel_hatchet", station: "forge", result: "coldsteel_hatchet", desc: "Топорик из хладостали", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 2, wood: 4, copper_ore: 2 } },
  { id: "recipe_coldsteel_great_axe", station: "forge", result: "coldsteel_great_axe", desc: "Секира из хладостали", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 5, steel: 2, wood: 4 } },
  { id: "recipe_coldsteel_mace", station: "forge", result: "coldsteel_mace", desc: "Булава из хладостали", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 4, copper_ore: 3 } },
  { id: "recipe_coldsteel_maul", station: "forge", result: "coldsteel_maul", desc: "Молот из хладостали", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 6, steel: 3, wood: 3 } },
  { id: "recipe_coldsteel_spear", station: "forge", result: "coldsteel_spear", desc: "Копьё из хладостали", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 4, wood: 5 } },
  { id: "recipe_coldsteel_great_sword", station: "forge", result: "coldsteel_great_sword", desc: "Двуручный меч из хладостали", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 6, steel: 4, leather: 2 } },
  // Тир 3 «Руны» (этаж 3)
  { id: "recipe_runic_long_sword", station: "forge", result: "runic_long_sword", desc: "Рунический длинный меч", floor: 3, dropChance: 0.05, materials: { grave_iron: 5, rune_dust: 2, bone: 1 } },
  { id: "recipe_runic_short_sword", station: "forge", result: "runic_short_sword", desc: "Рунический короткий меч", floor: 3, dropChance: 0.05, materials: { grave_iron: 3, rune_dust: 1, bone: 1 } },
  { id: "recipe_runic_rapier", station: "forge", result: "runic_rapier", desc: "Руническая рапира", floor: 3, dropChance: 0.05, materials: { grave_iron: 3, rune_dust: 2, silver: 1 } },
  { id: "recipe_runic_hatchet", station: "forge", result: "runic_hatchet", desc: "Рунический топорик", floor: 3, dropChance: 0.05, materials: { grave_iron: 3, bone: 4, rune_dust: 1 } },
  { id: "recipe_runic_great_axe", station: "forge", result: "runic_great_axe", desc: "Руническая секира", floor: 3, dropChance: 0.05, materials: { grave_iron: 7, bone: 4 } },
  { id: "recipe_runic_mace", station: "forge", result: "runic_mace", desc: "Руническая булава", floor: 3, dropChance: 0.05, materials: { grave_iron: 5, bone: 2, rune_dust: 1 } },
  { id: "recipe_runic_maul", station: "forge", result: "runic_maul", desc: "Рунический молот", floor: 3, dropChance: 0.05, materials: { grave_iron: 7, bone: 4, rune_dust: 2 } },
  { id: "recipe_runic_spear", station: "forge", result: "runic_spear", desc: "Руническое копьё", floor: 3, dropChance: 0.05, materials: { grave_iron: 5, silver: 1, bone: 4 } },
  { id: "recipe_runic_great_sword", station: "forge", result: "runic_great_sword", desc: "Рунический двуручный меч", floor: 3, dropChance: 0.05, materials: { grave_iron: 8, rune_dust: 3, silver: 2 } },

  // ── 1-Й ЭТАЖ (Тир 0 и Железо/Тир 1) ──
  { id: "recipe_gambeson", station: "forge", result: "gambeson", desc: "Стёганый гамбезон", floor: 1, dropChance: 0.05, materials: { cloth: 4, malachite: 2 } },
  { id: "recipe_iron_chainmail", station: "forge", result: "iron_chainmail", desc: "Железная кольчуга", floor: 1, dropChance: 0.05, materials: { iron_ore: 6, rust: 4 } },
  { id: "recipe_wood_club", station: "forge", result: "wood_club", desc: "Дубина", floor: 1, dropChance: 0.05, materials: { wood: 3, rust: 2 } },
  { id: "recipe_wood_shield", station: "forge", result: "wood_shield", desc: "Деревянный щит", floor: 1, dropChance: 0.05, materials: { wood: 5, malachite: 3 } },
  { id: "recipe_iron_shield", station: "forge", result: "iron_shield", desc: "Железный щит", floor: 1, dropChance: 0.05, materials: { iron_ore: 6, wood: 2, leather: 2 } },
  { id: "recipe_head_cloth", station: "forge", result: "head_cloth", desc: "Тканевый капюшон", floor: 1, dropChance: 0.05, materials: { cloth: 3, rust: 1 } },
  { id: "recipe_back_cloak", station: "forge", result: "back_cloak", desc: "Рваный плащ", floor: 1, dropChance: 0.05, materials: { cloth: 4, wood: 1 } },
  { id: "recipe_hands_gloves", station: "forge", result: "hands_gloves", desc: "Рабочие перчатки", floor: 1, dropChance: 0.05, materials: { leather: 2, cloth: 2 } },
  { id: "recipe_waist_rope", station: "forge", result: "waist_rope", desc: "Верёвочный пояс", floor: 1, dropChance: 0.05, materials: { cloth: 3, wood: 2 } },
  { id: "recipe_student_robe", station: "forge", result: "student_robe", desc: "Ученическая роба", floor: 1, dropChance: 0.05, materials: { cloth: 5, malachite: 2 } },
  { id: "recipe_ring_copper", station: "jewelry", result: "ring_copper", desc: "Медное кольцо", floor: 1, dropChance: 0.05, materials: { malachite: 1, rust: 1 } },
  { id: "recipe_neck_bone", station: "jewelry", result: "neck_bone", desc: "Грубый амулет", floor: 1, dropChance: 0.05, materials: { malachite: 2, rust: 2 } },
  { id: "recipe_trinket_coin", station: "jewelry", result: "trinket_coin", desc: "Счастливая монета", floor: 1, dropChance: 0.05, materials: { malachite: 2, rust: 2 } },

  // ── 2-Й ЭТАЖ (Железо высшего тира и Сталь/Тир 2) ──
  { id: "recipe_parrying_dagger", station: "forge", result: "parrying_dagger", desc: "Кинжал парирования", floor: 2, dropChance: 0.05, materials: { copper_ore: 4, leather: 2, steel: 1 } },
  
  { id: "recipe_leather", station: "forge", result: "leather_armor", desc: "Кожаный доспех", floor: 2, dropChance: 0.05, materials: { leather: 6, cloth: 3, iron_ore: 1 } },
  { id: "recipe_wanderer_coat", station: "forge", result: "wanderer_coat", desc: "Плащ странника", floor: 2, dropChance: 0.05, materials: { cloth: 5, leather: 2, wood: 1 } },
  { id: "recipe_head_iron", station: "forge", result: "head_iron", desc: "Железный шлем", floor: 2, dropChance: 0.05, materials: { copper_ore: 5, leather: 2 } },
  { id: "recipe_shoulder_leather", station: "forge", result: "shoulder_leather", desc: "Кожаные наплечники", floor: 2, dropChance: 0.05, materials: { leather: 4, iron_ore: 1 } },
  { id: "recipe_wrist_leather", station: "forge", result: "wrist_leather", desc: "Кожаные наручи", floor: 2, dropChance: 0.05, materials: { leather: 3, cloth: 1 } },
  { id: "recipe_legs_leather", station: "forge", result: "legs_leather", desc: "Кожаные штаны", floor: 2, dropChance: 0.05, materials: { leather: 5, cloth: 2 } },
  { id: "recipe_feet_leather", station: "forge", result: "feet_leather", desc: "Кожаные сапоги", floor: 2, dropChance: 0.05, materials: { leather: 4, cloth: 2 } },
  
  // Сталь (Тир 2)
  { id: "recipe_dense_cloth", station: "forge", result: "dense_cloth", desc: "Плотная ткань", floor: 2, dropChance: 0.05, materials: { steel: 2, cloth: 5, tin_ore: 2 } },
  { id: "recipe_steel_chainmail", station: "forge", result: "steel_chainmail", desc: "Стальная кольчуга", floor: 2, dropChance: 0.05, materials: { steel: 5, copper_ore: 4, leather: 2 } },
  { id: "recipe_steel_plate", station: "forge", result: "steel_plate", desc: "Стальные латы", floor: 2, dropChance: 0.05, materials: { steel: 8, copper_ore: 5, leather: 2 } },
  { id: "recipe_tower_shield", station: "forge", result: "tower_shield", desc: "Укрепленный башенный щит", floor: 2, dropChance: 0.05, materials: { steel: 6, copper_ore: 4, leather: 2 } },
  { id: "recipe_hood_mage", station: "forge", result: "hood_mage", desc: "Капюшон чародея", floor: 2, dropChance: 0.05, materials: { steel: 2, cloth: 4, tin_ore: 2 } },
  { id: "recipe_scout_gloves", station: "forge", result: "scout_gloves", desc: "Разведческие перчатки", floor: 2, dropChance: 0.05, materials: { iron_ore: 2, leather: 5 } },
  { id: "recipe_scout_boots", station: "forge", result: "scout_boots", desc: "Сапоги разведчика", floor: 2, dropChance: 0.05, materials: { iron_ore: 3, leather: 6 } },
  
  // Ювелирка 2-го этажа
  { id: "recipe_ring_silver", station: "jewelry", result: "ring_silver", desc: "Кольцо из холодного серебра", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 4, kobold_gear: 2 } },
  { id: "recipe_neck_guard", station: "jewelry", result: "neck_guard", desc: "Медальон караульного", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 5, tin_ore: 3 } },
  { id: "recipe_plate_gorget", station: "jewelry", result: "plate_gorget", desc: "Латный воротник", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 3, steel: 4, leather: 2 } },

  // ── 2-Й ЭТАЖ (Холодное железо/сет «Рудокоп») ──
  { id: "recipe_cold_iron_shield", station: "forge", result: "cold_iron_shield", desc: "Щит из холодного железа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 2, copper_ore: 3, tin_ore: 1 } },
  { id: "recipe_cold_iron_head", station: "forge", result: "cold_iron_head", desc: "Шлем из холодного железа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 2, copper_ore: 2 } },
  { id: "recipe_cold_iron_chest", station: "forge", result: "cold_iron_chest", desc: "Нагрудник из холодного железа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 4, copper_ore: 3, tin_ore: 2 } },
  { id: "recipe_cold_iron_hands", station: "forge", result: "cold_iron_hands", desc: "Перчатки из холодного железа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 1, copper_ore: 2, tin_ore: 1 } },
  { id: "recipe_cold_iron_feet", station: "forge", result: "cold_iron_feet", desc: "Сапоги из холодного железа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 2, copper_ore: 2, tin_ore: 2 } },
  { id: "recipe_cold_iron_ring", station: "jewelry", result: "cold_iron_ring", desc: "Кольцо из холодного железа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 1, copper_ore: 2 } },
  { id: "recipe_cold_iron_neck", station: "jewelry", result: "cold_iron_neck", desc: "Амулет из холодного железа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 2, copper_ore: 1, tin_ore: 1 } },
  // Сет «Рудокоп» (холодное железо, этаж 2)
  { id: "recipe_set_miner_head", station: "forge", result: "set_miner_head", desc: "Шлем рудокопа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 1, kobold_gear: 1, copper_ore: 2 } },
  { id: "recipe_set_miner_chest", station: "forge", result: "set_miner_chest", desc: "Мантия Подземного Короля", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 3, kobold_gear: 2, copper_ore: 3 } },
  { id: "recipe_set_miner_legs", station: "forge", result: "set_miner_legs", desc: "Штаны рудокопа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 2, copper_ore: 3, tin_ore: 2 } },
  { id: "recipe_set_miner_hands", station: "forge", result: "set_miner_hands", desc: "Перчатки рудокопа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 1, kobold_gear: 1, tin_ore: 2 } },
  { id: "recipe_set_miner_feet", station: "forge", result: "set_miner_feet", desc: "Сапоги рудокопа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 1, copper_ore: 2, tin_ore: 2 } },

  // ── 3-Й ЭТАЖ (Сталь/сет «Страж склепа») ──
  { id: "recipe_steel_bulwark", station: "forge", result: "steel_bulwark", desc: "Стальной оплот", floor: 3, dropChance: 0.05, materials: { grave_iron: 3, bone: 2, silver: 1 } },
  { id: "recipe_steel_head", station: "forge", result: "steel_head", desc: "Стальной шлем", floor: 3, dropChance: 0.05, materials: { grave_iron: 3, bone: 2 } },
  { id: "recipe_steel_chest", station: "forge", result: "steel_chest", desc: "Стальная кираса", floor: 3, dropChance: 0.05, materials: { grave_iron: 5, bone: 3, cursed_cloth: 1 } },
  { id: "recipe_steel_legs", station: "forge", result: "steel_legs", desc: "Стальные поножи", floor: 3, dropChance: 0.05, materials: { grave_iron: 4, bone: 2 } },
  { id: "recipe_steel_feet", station: "forge", result: "steel_feet", desc: "Стальные сапоги", floor: 3, dropChance: 0.05, materials: { grave_iron: 3, bone: 2, cursed_cloth: 1 } },
  { id: "recipe_steel_ring", station: "jewelry", result: "steel_ring", desc: "Стальное кольцо", floor: 3, dropChance: 0.05, materials: { silver: 3, grave_iron: 2, bone: 1 } },
  { id: "recipe_steel_trinket", station: "jewelry", result: "steel_trinket", desc: "Стальной талисман", floor: 3, dropChance: 0.05, materials: { silver: 3, cursed_cloth: 2, bone: 1 } },
  // Сет «Страж склепа» (сталь, этаж 3)
  { id: "recipe_set_guard_head", station: "forge", result: "set_guard_head", desc: "Шлем стража склепа", floor: 3, dropChance: 0.05, materials: { grave_iron: 3, bone: 2, silver: 1 } },
  { id: "recipe_set_guard_chest", station: "forge", result: "set_guard_chest", desc: "Латы Вечного Стража", floor: 3, dropChance: 0.05, materials: { grave_iron: 5, bone: 3, cursed_cloth: 1 } },
  { id: "recipe_set_guard_legs", station: "forge", result: "set_guard_legs", desc: "Поножи стража склепа", floor: 3, dropChance: 0.05, materials: { grave_iron: 4, bone: 2, cursed_cloth: 1 } },
  { id: "recipe_set_guard_hands", station: "forge", result: "set_guard_hands", desc: "Рукавицы стража склепа", floor: 3, dropChance: 0.05, materials: { grave_iron: 3, bone: 2, silver: 1 } },
  { id: "recipe_set_guard_feet", station: "forge", result: "set_guard_feet", desc: "Сапоги стража склепа", floor: 3, dropChance: 0.05, materials: { grave_iron: 3, bone: 2, cursed_cloth: 1 } },

  // ── 4-Й ЭТАЖ (Мифрил) ──
  { id: "recipe_mithril_shield", station: "forge", result: "mithril_shield", desc: "Мифриловый щит", floor: 4, dropChance: 0.05, materials: { mithril_ore: 4, war_crystal: 2 } },
  { id: "recipe_mithril_head", station: "forge", result: "mithril_head", desc: "Мифриловый шлем", floor: 4, dropChance: 0.05, materials: { mithril_ore: 4, orc_tusk: 2 } },
  { id: "recipe_mithril_chest", station: "forge", result: "mithril_chest", desc: "Мифриловая кольчуга", floor: 4, dropChance: 0.05, materials: { mithril_ore: 6, blood_herb: 3, war_crystal: 1 } },
  { id: "recipe_mithril_hands", station: "forge", result: "mithril_hands", desc: "Мифриловые перчатки", floor: 4, dropChance: 0.05, materials: { mithril_ore: 3, orc_tusk: 2 } },
  { id: "recipe_mithril_legs", station: "forge", result: "mithril_legs", desc: "Мифриловые поножи", floor: 4, dropChance: 0.05, materials: { mithril_ore: 5, war_crystal: 1 } },
  { id: "recipe_mithril_ring", station: "jewelry", result: "mithril_ring", desc: "Мифриловое кольцо", floor: 4, dropChance: 0.05, materials: { mithril_ore: 3, war_crystal: 2 } },
  { id: "recipe_mithril_trinket", station: "jewelry", result: "mithril_trinket", desc: "Мифриловый амулет", floor: 4, dropChance: 0.05, materials: { mithril_ore: 2, blood_herb: 2, war_crystal: 2 } },

  // ── 5-Й ЭТАЖ (Адский камень/сет «Адский клинок») ──
  { id: "recipe_hell_shield", station: "forge", result: "hell_shield", desc: "Щит из адского камня", floor: 5, dropChance: 0.05, materials: { hellstone: 5, brimstone: 2, void_crystal: 1 } },
  { id: "recipe_hell_ring", station: "jewelry", result: "hell_ring", desc: "Кольцо из адского камня", floor: 5, dropChance: 0.05, materials: { hellstone: 3, demon_horn: 1, void_crystal: 2 } },
  { id: "recipe_hell_trinket", station: "jewelry", result: "hell_trinket", desc: "Амулет из адского камня", floor: 5, dropChance: 0.05, materials: { hellstone: 2, brimstone: 2, void_crystal: 2 } },
  // Сет «Адский клинок» (адский камень, этаж 5)
  { id: "recipe_set_hellblade_head", station: "forge", result: "set_hellblade_head", desc: "Шлем адского клинка", floor: 5, dropChance: 0.05, materials: { hellstone: 4, demon_horn: 2, void_crystal: 1 } },
  { id: "recipe_set_hellblade_chest", station: "forge", result: "set_hellblade_chest", desc: "Кираса Пожирателя Душ", floor: 5, dropChance: 0.05, materials: { hellstone: 6, demon_horn: 3, void_crystal: 1 } },
  { id: "recipe_set_hellblade_legs", station: "forge", result: "set_hellblade_legs", desc: "Поножи адского клинка", floor: 5, dropChance: 0.05, materials: { hellstone: 5, brimstone: 2, demon_horn: 2 } },
  { id: "recipe_set_hellblade_hands", station: "forge", result: "set_hellblade_hands", desc: "Рукавицы адского клинка", floor: 5, dropChance: 0.05, materials: { hellstone: 4, demon_horn: 2, brimstone: 1 } },
  { id: "recipe_set_hellblade_feet", station: "forge", result: "set_hellblade_feet", desc: "Сапоги адского клинка", floor: 5, dropChance: 0.05, materials: { hellstone: 4, brimstone: 2, demon_horn: 2 } },

  // ══════════════════════════════════════════════════════════════════════════
  // РЕЦЕПТЫ СЕТОВ БРОНИ: 8 на сет (160 предметов). Только ресурсы своего этажа.
  // ══════════════════════════════════════════════════════════════════════════

  // ── Тир 1: «Грубая кольчуга» (7 новых слотов; iron_chainmail — выше) ──
  { id: "recipe_set_rough_chain_head", station: "forge", result: "set_rough_chain_head", desc: "Шлем грубой кольчуги", floor: 1, dropChance: 0.05, materials: { iron_ore: 4, rust: 2 } },
  { id: "recipe_set_rough_chain_shoulder", station: "forge", result: "set_rough_chain_shoulder", desc: "Наплечники грубой кольчуги", floor: 1, dropChance: 0.05, materials: { iron_ore: 4, rust: 2 } },
  { id: "recipe_set_rough_chain_wrist", station: "forge", result: "set_rough_chain_wrist", desc: "Наручи грубой кольчуги", floor: 1, dropChance: 0.05, materials: { iron_ore: 3, rust: 1 } },
  { id: "recipe_set_rough_chain_hands", station: "forge", result: "set_rough_chain_hands", desc: "Рукавицы грубой кольчуги", floor: 1, dropChance: 0.05, materials: { iron_ore: 3, rust: 1 } },
  { id: "recipe_set_rough_chain_waist", station: "forge", result: "set_rough_chain_waist", desc: "Пояс грубой кольчуги", floor: 1, dropChance: 0.05, materials: { iron_ore: 3, rust: 1 } },
  { id: "recipe_set_rough_chain_legs", station: "forge", result: "set_rough_chain_legs", desc: "Поножи грубой кольчуги", floor: 1, dropChance: 0.05, materials: { iron_ore: 5, rust: 3 } },
  { id: "recipe_set_rough_chain_feet", station: "forge", result: "set_rough_chain_feet", desc: "Сапоги грубой кольчуги", floor: 1, dropChance: 0.05, materials: { iron_ore: 4, rust: 2 } },

  // ── Тир 1: «Грубое железо» (7 недостающих: без head_iron) ──
  { id: "recipe_dented_plate", station: "forge", result: "dented_plate", desc: "Мятые латы", floor: 1, dropChance: 0.05, materials: { iron_ore: 8, wood: 2, leather: 2 } },
  { id: "recipe_shoulder_iron", station: "forge", result: "shoulder_iron", desc: "Железные наплечники", floor: 2, dropChance: 0.05, materials: { copper_ore: 4, leather: 2 } },
  { id: "recipe_wrist_iron", station: "forge", result: "wrist_iron", desc: "Железные наручи", floor: 1, dropChance: 0.05, materials: { iron_ore: 4, leather: 1 } },
  { id: "recipe_hands_iron", station: "forge", result: "hands_iron", desc: "Железные рукавицы", floor: 2, dropChance: 0.05, materials: { copper_ore: 3, tin_ore: 1, leather: 1 } },
  { id: "recipe_waist_plate", station: "forge", result: "waist_plate", desc: "Пояс из пластин", floor: 2, dropChance: 0.05, materials: { copper_ore: 3, leather: 2 } },
  { id: "recipe_legs_iron", station: "forge", result: "legs_iron", desc: "Железные поножи", floor: 1, dropChance: 0.05, materials: { iron_ore: 6, leather: 2 } },
  { id: "recipe_feet_iron", station: "forge", result: "feet_iron", desc: "Железные сапоги", floor: 2, dropChance: 0.05, materials: { copper_ore: 4, leather: 2 } },

  // ── Тир 1: «Из грубой кожи» (2 недостающих) ──
  { id: "recipe_head_leather", station: "forge", result: "head_leather", desc: "Кожаный капюшон", floor: 1, dropChance: 0.05, materials: { leather: 4, cloth: 2 } },
  { id: "recipe_waist_leather", station: "forge", result: "waist_leather", desc: "Кожаный ремень", floor: 1, dropChance: 0.05, materials: { leather: 3, cloth: 1, wood: 1 } },

  // ── Тир 1: «Послушник» (5 недостающих) ──
  { id: "recipe_shoulder_cloth", station: "forge", result: "shoulder_cloth", desc: "Тканевые накидки", floor: 1, dropChance: 0.05, materials: { cloth: 3, rust: 1 } },
  { id: "recipe_wrist_cloth", station: "forge", result: "wrist_cloth", desc: "Тканевые обмотки", floor: 1, dropChance: 0.05, materials: { cloth: 2, rust: 1 } },
  { id: "recipe_hands_cloth", station: "forge", result: "hands_cloth", desc: "Тканевые перчатки", floor: 1, dropChance: 0.05, materials: { cloth: 2, malachite: 1 } },
  { id: "recipe_legs_cloth", station: "forge", result: "legs_cloth", desc: "Тканевые штаны", floor: 1, dropChance: 0.05, materials: { cloth: 4, wood: 1 } },
  { id: "recipe_feet_cloth", station: "forge", result: "feet_cloth", desc: "Тканевые тапочки", floor: 1, dropChance: 0.05, materials: { cloth: 3, rust: 1 } },

  // ── Тир 2: «Сталь» (4 новых слота) ──
  { id: "recipe_steel_shoulder", station: "forge", result: "steel_shoulder", desc: "Стальные наплечники", floor: 2, dropChance: 0.05, materials: { steel: 3, copper_ore: 2 } },
  { id: "recipe_steel_wrist", station: "forge", result: "steel_wrist", desc: "Стальные наручи", floor: 2, dropChance: 0.05, materials: { steel: 2, tin_ore: 2 } },
  { id: "recipe_steel_hands", station: "forge", result: "steel_hands", desc: "Стальные рукавицы", floor: 2, dropChance: 0.05, materials: { steel: 2, copper_ore: 2 } },
  { id: "recipe_steel_waist", station: "forge", result: "steel_waist", desc: "Стальной пояс", floor: 2, dropChance: 0.05, materials: { steel: 2, tin_ore: 2 } },

  // ── Тир 2: «Стальная кольчуга» (7 новых слотов; steel_chainmail — выше) ──
  { id: "recipe_set_steel_chain_head", station: "forge", result: "set_steel_chain_head", desc: "Шлем стальной кольчуги", floor: 2, dropChance: 0.05, materials: { steel: 4, copper_ore: 2 } },
  { id: "recipe_set_steel_chain_shoulder", station: "forge", result: "set_steel_chain_shoulder", desc: "Наплечники стальной кольчуги", floor: 2, dropChance: 0.05, materials: { steel: 3, copper_ore: 2 } },
  { id: "recipe_set_steel_chain_wrist", station: "forge", result: "set_steel_chain_wrist", desc: "Наручи стальной кольчуги", floor: 2, dropChance: 0.05, materials: { steel: 2, cold_iron_ingot: 1 } },
  { id: "recipe_set_steel_chain_hands", station: "forge", result: "set_steel_chain_hands", desc: "Рукавицы стальной кольчуги", floor: 2, dropChance: 0.05, materials: { steel: 2, cold_iron_ingot: 1 } },
  { id: "recipe_set_steel_chain_waist", station: "forge", result: "set_steel_chain_waist", desc: "Пояс стальной кольчуги", floor: 2, dropChance: 0.05, materials: { steel: 2, cold_iron_ingot: 1 } },
  { id: "recipe_set_steel_chain_legs", station: "forge", result: "set_steel_chain_legs", desc: "Поножи стальной кольчуги", floor: 2, dropChance: 0.05, materials: { steel: 4, tin_ore: 2, kobold_gear: 1 } },
  { id: "recipe_set_steel_chain_feet", station: "forge", result: "set_steel_chain_feet", desc: "Сапоги стальной кольчуги", floor: 2, dropChance: 0.05, materials: { steel: 3, copper_ore: 2 } },

  // ── Тир 2: «Тёмная кожа» (3 недостающих) ──
  { id: "recipe_set_miner_shoulder", station: "forge", result: "set_miner_shoulder", desc: "Наплечники рудокопа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 2, kobold_gear: 1, copper_ore: 2 } },
  { id: "recipe_set_miner_wrist", station: "forge", result: "set_miner_wrist", desc: "Наручи рудокопа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 1, kobold_gear: 1, tin_ore: 2 } },
  { id: "recipe_set_miner_waist", station: "forge", result: "set_miner_waist", desc: "Пояс рудокопа", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 1, kobold_gear: 1, tin_ore: 2 } },

  // ── Тир 2: «Подмастерье» (6 недостающих) ──
  { id: "recipe_set_apprentice_cloth_shoulder", station: "forge", result: "set_apprentice_cloth_shoulder", desc: "Накидки подмастерья", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 1, tin_ore: 2, cave_mushroom: 1 } },
  { id: "recipe_set_apprentice_cloth_wrist", station: "forge", result: "set_apprentice_cloth_wrist", desc: "Обмотки подмастерья", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 1, tin_ore: 1, cave_mushroom: 2 } },
  { id: "recipe_set_apprentice_cloth_hands", station: "forge", result: "set_apprentice_cloth_hands", desc: "Перчатки подмастерья", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 1, tin_ore: 1, cave_mushroom: 2 } },
  { id: "recipe_set_apprentice_cloth_waist", station: "forge", result: "set_apprentice_cloth_waist", desc: "Пояс подмастерья", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 1, tin_ore: 1, cave_mushroom: 2 } },
  { id: "recipe_set_apprentice_cloth_legs", station: "forge", result: "set_apprentice_cloth_legs", desc: "Штаны подмастерья", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 2, tin_ore: 2, cave_mushroom: 1 } },
  { id: "recipe_set_apprentice_cloth_feet", station: "forge", result: "set_apprentice_cloth_feet", desc: "Тапочки подмастерья", floor: 2, dropChance: 0.05, materials: { cold_iron_ingot: 1, copper_ore: 2, cave_mushroom: 2 } },

  // ── Тир 3: «Руническая сталь» (3 недостающих) ──
  { id: "recipe_set_guard_shoulder", station: "forge", result: "set_guard_shoulder", desc: "Наплечники стража склепа", floor: 3, dropChance: 0.05, materials: { grave_iron: 4, bone: 2, silver: 1 } },
  { id: "recipe_set_guard_wrist", station: "forge", result: "set_guard_wrist", desc: "Наручи стража склепа", floor: 3, dropChance: 0.05, materials: { grave_iron: 3, bone: 2, silver: 1 } },
  { id: "recipe_set_guard_waist", station: "forge", result: "set_guard_waist", desc: "Пояс стража склепа", floor: 3, dropChance: 0.05, materials: { grave_iron: 3, bone: 2, cursed_cloth: 1 } },

  // ── Тир 3: «Руническая кольчуга» ──
  { id: "recipe_set_runic_chain_head", station: "forge", result: "set_runic_chain_head", desc: "Рунический кольчужный шлем", floor: 3, dropChance: 0.05, materials: { grave_iron: 4, rune_dust: 2 } },
  { id: "recipe_set_runic_chain_shoulder", station: "forge", result: "set_runic_chain_shoulder", desc: "Рунические кольчужные наплечники", floor: 3, dropChance: 0.05, materials: { grave_iron: 4, rune_dust: 2 } },
  { id: "recipe_set_runic_chain_chest", station: "forge", result: "set_runic_chain_chest", desc: "Руническая кольчуга", floor: 3, dropChance: 0.05, materials: { grave_iron: 6, rune_dust: 3, bone: 2 } },
  { id: "recipe_set_runic_chain_wrist", station: "forge", result: "set_runic_chain_wrist", desc: "Рунические кольчужные наручи", floor: 3, dropChance: 0.05, materials: { grave_iron: 3, rune_dust: 1 } },
  { id: "recipe_set_runic_chain_hands", station: "forge", result: "set_runic_chain_hands", desc: "Рунические кольчужные рукавицы", floor: 3, dropChance: 0.05, materials: { grave_iron: 3, rune_dust: 1 } },
  { id: "recipe_set_runic_chain_waist", station: "forge", result: "set_runic_chain_waist", desc: "Рунический кольчужный пояс", floor: 3, dropChance: 0.05, materials: { grave_iron: 3, rune_dust: 1 } },
  { id: "recipe_set_runic_chain_legs", station: "forge", result: "set_runic_chain_legs", desc: "Рунические кольчужные поножи", floor: 3, dropChance: 0.05, materials: { grave_iron: 5, rune_dust: 2, silver: 1 } },
  { id: "recipe_set_runic_chain_feet", station: "forge", result: "set_runic_chain_feet", desc: "Рунические кольчужные сапоги", floor: 3, dropChance: 0.05, materials: { grave_iron: 4, rune_dust: 2 } },

  // ── Тир 3: «Руническая кожа» ──
  { id: "recipe_set_runic_leather_head", station: "forge", result: "set_runic_leather_head", desc: "Рунический кожаный капюшон", floor: 3, dropChance: 0.05, materials: { bone: 4, rune_dust: 1 } },
  { id: "recipe_set_runic_leather_shoulder", station: "forge", result: "set_runic_leather_shoulder", desc: "Рунические кожаные наплечники", floor: 3, dropChance: 0.05, materials: { bone: 4, rune_dust: 1 } },
  { id: "recipe_set_runic_leather_chest", station: "forge", result: "set_runic_leather_chest", desc: "Рунический кожаный доспех", floor: 3, dropChance: 0.05, materials: { bone: 6, rune_dust: 2, cursed_cloth: 1 } },
  { id: "recipe_set_runic_leather_wrist", station: "forge", result: "set_runic_leather_wrist", desc: "Рунические кожаные наручи", floor: 3, dropChance: 0.05, materials: { bone: 2, rune_dust: 1 } },
  { id: "recipe_set_runic_leather_hands", station: "forge", result: "set_runic_leather_hands", desc: "Рунические кожаные перчатки", floor: 3, dropChance: 0.05, materials: { bone: 2, rune_dust: 1 } },
  { id: "recipe_set_runic_leather_waist", station: "forge", result: "set_runic_leather_waist", desc: "Рунический кожаный ремень", floor: 3, dropChance: 0.05, materials: { bone: 2, rune_dust: 1 } },
  { id: "recipe_set_runic_leather_legs", station: "forge", result: "set_runic_leather_legs", desc: "Рунические кожаные штаны", floor: 3, dropChance: 0.05, materials: { bone: 5, rune_dust: 2, silver: 1 } },
  { id: "recipe_set_runic_leather_feet", station: "forge", result: "set_runic_leather_feet", desc: "Рунические кожаные сапоги", floor: 3, dropChance: 0.05, materials: { bone: 3, rune_dust: 1 } },

  // ── Тир 3: «Адепт» ──
  { id: "recipe_set_adept_cloth_head", station: "forge", result: "set_adept_cloth_head", desc: "Капюшон адепта", floor: 3, dropChance: 0.05, materials: { cursed_cloth: 3, rune_dust: 2 } },
  { id: "recipe_set_adept_cloth_shoulder", station: "forge", result: "set_adept_cloth_shoulder", desc: "Накидки адепта", floor: 3, dropChance: 0.05, materials: { cursed_cloth: 3, rune_dust: 1 } },
  { id: "recipe_set_adept_cloth_chest", station: "forge", result: "set_adept_cloth_chest", desc: "Роба адепта", floor: 3, dropChance: 0.05, materials: { cursed_cloth: 5, rune_dust: 3 } },
  { id: "recipe_set_adept_cloth_wrist", station: "forge", result: "set_adept_cloth_wrist", desc: "Обмотки адепта", floor: 3, dropChance: 0.05, materials: { cursed_cloth: 2, rune_dust: 1 } },
  { id: "recipe_set_adept_cloth_hands", station: "forge", result: "set_adept_cloth_hands", desc: "Перчатки адепта", floor: 3, dropChance: 0.05, materials: { cursed_cloth: 2, rune_dust: 1 } },
  { id: "recipe_set_adept_cloth_waist", station: "forge", result: "set_adept_cloth_waist", desc: "Пояс адепта", floor: 3, dropChance: 0.05, materials: { cursed_cloth: 2, rune_dust: 1 } },
  { id: "recipe_set_adept_cloth_legs", station: "forge", result: "set_adept_cloth_legs", desc: "Штаны адепта", floor: 3, dropChance: 0.05, materials: { cursed_cloth: 4, rune_dust: 2, silver: 1 } },
  { id: "recipe_set_adept_cloth_feet", station: "forge", result: "set_adept_cloth_feet", desc: "Сапоги адепта", floor: 3, dropChance: 0.05, materials: { cursed_cloth: 3, rune_dust: 1 } },

  // ── Тир 4: «Мифрил» (4 новых слота) ──
  { id: "recipe_mithril_shoulder", station: "forge", result: "mithril_shoulder", desc: "Мифриловые наплечники", floor: 4, dropChance: 0.05, materials: { mithril_ore: 4, orc_tusk: 2 } },
  { id: "recipe_mithril_wrist", station: "forge", result: "mithril_wrist", desc: "Мифриловые наручи", floor: 4, dropChance: 0.05, materials: { mithril_ore: 3, orc_tusk: 2 } },
  { id: "recipe_mithril_waist", station: "forge", result: "mithril_waist", desc: "Мифриловый пояс", floor: 4, dropChance: 0.05, materials: { mithril_ore: 3, war_crystal: 1 } },
  { id: "recipe_mithril_feet", station: "forge", result: "mithril_feet", desc: "Мифриловые сапоги", floor: 4, dropChance: 0.05, materials: { mithril_ore: 4, orc_tusk: 1, war_crystal: 1 } },

  // ── Тир 4: «Мифриловая кольчуга» ──
  { id: "recipe_set_mithril_chain_head", station: "forge", result: "set_mithril_chain_head", desc: "Мифриловый кольчужный шлем", floor: 4, dropChance: 0.05, materials: { mithril_ore: 4, iron_chain: 2 } },
  { id: "recipe_set_mithril_chain_shoulder", station: "forge", result: "set_mithril_chain_shoulder", desc: "Мифриловые кольчужные наплечники", floor: 4, dropChance: 0.05, materials: { mithril_ore: 4, iron_chain: 2 } },
  { id: "recipe_set_mithril_chain_chest", station: "forge", result: "set_mithril_chain_chest", desc: "Мифриловая кольчуга", floor: 4, dropChance: 0.05, materials: { mithril_ore: 6, iron_chain: 3, war_crystal: 1 } },
  { id: "recipe_set_mithril_chain_wrist", station: "forge", result: "set_mithril_chain_wrist", desc: "Мифриловые кольчужные наручи", floor: 4, dropChance: 0.05, materials: { mithril_ore: 3, iron_chain: 1 } },
  { id: "recipe_set_mithril_chain_hands", station: "forge", result: "set_mithril_chain_hands", desc: "Мифриловые кольчужные рукавицы", floor: 4, dropChance: 0.05, materials: { mithril_ore: 3, iron_chain: 1 } },
  { id: "recipe_set_mithril_chain_waist", station: "forge", result: "set_mithril_chain_waist", desc: "Мифриловый кольчужный пояс", floor: 4, dropChance: 0.05, materials: { mithril_ore: 3, iron_chain: 1 } },
  { id: "recipe_set_mithril_chain_legs", station: "forge", result: "set_mithril_chain_legs", desc: "Мифриловые кольчужные поножи", floor: 4, dropChance: 0.05, materials: { mithril_ore: 5, iron_chain: 2, war_crystal: 1 } },
  { id: "recipe_set_mithril_chain_feet", station: "forge", result: "set_mithril_chain_feet", desc: "Мифриловые кольчужные сапоги", floor: 4, dropChance: 0.05, materials: { mithril_ore: 4, iron_chain: 2 } },

  // ── Тир 4: «Кожа с костяными пластинами» ──
  { id: "recipe_set_bone_leather_head", station: "forge", result: "set_bone_leather_head", desc: "Шлем из костяной кожи", floor: 4, dropChance: 0.05, materials: { orc_tusk: 3, blood_herb: 2 } },
  { id: "recipe_set_bone_leather_shoulder", station: "forge", result: "set_bone_leather_shoulder", desc: "Костяные наплечники", floor: 4, dropChance: 0.05, materials: { orc_tusk: 3, blood_herb: 2 } },
  { id: "recipe_set_bone_leather_chest", station: "forge", result: "set_bone_leather_chest", desc: "Костяная кираса", floor: 4, dropChance: 0.05, materials: { orc_tusk: 5, blood_herb: 3, iron_chain: 2 } },
  { id: "recipe_set_bone_leather_wrist", station: "forge", result: "set_bone_leather_wrist", desc: "Костяные наручи", floor: 4, dropChance: 0.05, materials: { orc_tusk: 2, blood_herb: 1 } },
  { id: "recipe_set_bone_leather_hands", station: "forge", result: "set_bone_leather_hands", desc: "Костяные перчатки", floor: 4, dropChance: 0.05, materials: { orc_tusk: 2, blood_herb: 1 } },
  { id: "recipe_set_bone_leather_waist", station: "forge", result: "set_bone_leather_waist", desc: "Костяной ремень", floor: 4, dropChance: 0.05, materials: { orc_tusk: 2, blood_herb: 1 } },
  { id: "recipe_set_bone_leather_legs", station: "forge", result: "set_bone_leather_legs", desc: "Костяные штаны", floor: 4, dropChance: 0.05, materials: { orc_tusk: 4, blood_herb: 2, war_crystal: 1 } },
  { id: "recipe_set_bone_leather_feet", station: "forge", result: "set_bone_leather_feet", desc: "Костяные сапоги", floor: 4, dropChance: 0.05, materials: { orc_tusk: 3, blood_herb: 2 } },

  // ── Тир 4: «Маг» ──
  { id: "recipe_set_mage_cloth_head", station: "forge", result: "set_mage_cloth_head", desc: "Капюшон мага", floor: 4, dropChance: 0.05, materials: { war_crystal: 2, blood_herb: 3 } },
  { id: "recipe_set_mage_cloth_shoulder", station: "forge", result: "set_mage_cloth_shoulder", desc: "Накидка мага", floor: 4, dropChance: 0.05, materials: { war_crystal: 2, blood_herb: 2 } },
  { id: "recipe_set_mage_cloth_chest", station: "forge", result: "set_mage_cloth_chest", desc: "Мантия мага", floor: 4, dropChance: 0.05, materials: { war_crystal: 3, blood_herb: 4 } },
  { id: "recipe_set_mage_cloth_wrist", station: "forge", result: "set_mage_cloth_wrist", desc: "Наручи мага", floor: 4, dropChance: 0.05, materials: { war_crystal: 1, blood_herb: 2 } },
  { id: "recipe_set_mage_cloth_hands", station: "forge", result: "set_mage_cloth_hands", desc: "Перчатки мага", floor: 4, dropChance: 0.05, materials: { war_crystal: 1, blood_herb: 2 } },
  { id: "recipe_set_mage_cloth_waist", station: "forge", result: "set_mage_cloth_waist", desc: "Пояс мага", floor: 4, dropChance: 0.05, materials: { war_crystal: 1, blood_herb: 2 } },
  { id: "recipe_set_mage_cloth_legs", station: "forge", result: "set_mage_cloth_legs", desc: "Штаны мага", floor: 4, dropChance: 0.05, materials: { war_crystal: 2, blood_herb: 3 } },
  { id: "recipe_set_mage_cloth_feet", station: "forge", result: "set_mage_cloth_feet", desc: "Сапоги мага", floor: 4, dropChance: 0.05, materials: { war_crystal: 2, blood_herb: 2 } },

  // ── Тир 5: «Бездна» (3 недостающих слота) ──
  { id: "recipe_set_hellblade_shoulder", station: "forge", result: "set_hellblade_shoulder", desc: "Наплечники адского клинка", floor: 5, dropChance: 0.05, materials: { hellstone: 4, demon_horn: 2, brimstone: 1 } },
  { id: "recipe_set_hellblade_wrist", station: "forge", result: "set_hellblade_wrist", desc: "Наручи адского клинка", floor: 5, dropChance: 0.05, materials: { hellstone: 3, brimstone: 2, infernal_ash: 1 } },
  { id: "recipe_set_hellblade_waist", station: "forge", result: "set_hellblade_waist", desc: "Пояс адского клинка", floor: 5, dropChance: 0.05, materials: { hellstone: 3, demon_horn: 1, infernal_ash: 2 } },

  // ── Тир 5: «Кольчуга Бездны» ──
  { id: "recipe_set_abyss_chain_head", station: "forge", result: "set_abyss_chain_head", desc: "Кольчужный шлем Бездны", floor: 5, dropChance: 0.05, materials: { hellstone: 4, infernal_ash: 2 } },
  { id: "recipe_set_abyss_chain_shoulder", station: "forge", result: "set_abyss_chain_shoulder", desc: "Кольчужные наплечники Бездны", floor: 5, dropChance: 0.05, materials: { hellstone: 4, infernal_ash: 2 } },
  { id: "recipe_set_abyss_chain_chest", station: "forge", result: "set_abyss_chain_chest", desc: "Кольчуга Бездны", floor: 5, dropChance: 0.05, materials: { hellstone: 6, brimstone: 3, void_crystal: 1 } },
  { id: "recipe_set_abyss_chain_wrist", station: "forge", result: "set_abyss_chain_wrist", desc: "Кольчужные наручи Бездны", floor: 5, dropChance: 0.05, materials: { hellstone: 3, infernal_ash: 1 } },
  { id: "recipe_set_abyss_chain_hands", station: "forge", result: "set_abyss_chain_hands", desc: "Кольчужные рукавицы Бездны", floor: 5, dropChance: 0.05, materials: { hellstone: 3, infernal_ash: 1 } },
  { id: "recipe_set_abyss_chain_waist", station: "forge", result: "set_abyss_chain_waist", desc: "Кольчужный пояс Бездны", floor: 5, dropChance: 0.05, materials: { hellstone: 3, infernal_ash: 1 } },
  { id: "recipe_set_abyss_chain_legs", station: "forge", result: "set_abyss_chain_legs", desc: "Кольчужные поножи Бездны", floor: 5, dropChance: 0.05, materials: { hellstone: 5, brimstone: 2, infernal_ash: 1 } },
  { id: "recipe_set_abyss_chain_feet", station: "forge", result: "set_abyss_chain_feet", desc: "Кольчужные сапоги Бездны", floor: 5, dropChance: 0.05, materials: { hellstone: 4, infernal_ash: 2 } },

  // ── Тир 5: «Кожа Бездны» ──
  { id: "recipe_set_abyss_leather_head", station: "forge", result: "set_abyss_leather_head", desc: "Кожаный шлем Бездны", floor: 5, dropChance: 0.05, materials: { demon_horn: 3, infernal_ash: 2 } },
  { id: "recipe_set_abyss_leather_shoulder", station: "forge", result: "set_abyss_leather_shoulder", desc: "Кожаные наплечники Бездны", floor: 5, dropChance: 0.05, materials: { demon_horn: 3, infernal_ash: 2 } },
  { id: "recipe_set_abyss_leather_chest", station: "forge", result: "set_abyss_leather_chest", desc: "Кожаный доспех Бездны", floor: 5, dropChance: 0.05, materials: { demon_horn: 5, brimstone: 2, infernal_ash: 2 } },
  { id: "recipe_set_abyss_leather_wrist", station: "forge", result: "set_abyss_leather_wrist", desc: "Кожаные наручи Бездны", floor: 5, dropChance: 0.05, materials: { demon_horn: 2, infernal_ash: 1 } },
  { id: "recipe_set_abyss_leather_hands", station: "forge", result: "set_abyss_leather_hands", desc: "Кожаные перчатки Бездны", floor: 5, dropChance: 0.05, materials: { demon_horn: 2, infernal_ash: 1 } },
  { id: "recipe_set_abyss_leather_waist", station: "forge", result: "set_abyss_leather_waist", desc: "Кожаный ремень Бездны", floor: 5, dropChance: 0.05, materials: { demon_horn: 2, infernal_ash: 1 } },
  { id: "recipe_set_abyss_leather_legs", station: "forge", result: "set_abyss_leather_legs", desc: "Кожаные штаны Бездны", floor: 5, dropChance: 0.05, materials: { demon_horn: 4, infernal_ash: 3 } },
  { id: "recipe_set_abyss_leather_feet", station: "forge", result: "set_abyss_leather_feet", desc: "Кожаные сапоги Бездны", floor: 5, dropChance: 0.05, materials: { demon_horn: 3, infernal_ash: 2 } },

  // ── Тир 5: «Архимаг» ──
  { id: "recipe_set_archmage_cloth_head", station: "forge", result: "set_archmage_cloth_head", desc: "Капюшон архимага", floor: 5, dropChance: 0.05, materials: { void_crystal: 2, infernal_ash: 3 } },
  { id: "recipe_set_archmage_cloth_shoulder", station: "forge", result: "set_archmage_cloth_shoulder", desc: "Накидка архимага", floor: 5, dropChance: 0.05, materials: { void_crystal: 1, infernal_ash: 3 } },
  { id: "recipe_set_archmage_cloth_chest", station: "forge", result: "set_archmage_cloth_chest", desc: "Мантия архимага", floor: 5, dropChance: 0.05, materials: { void_crystal: 3, infernal_ash: 4, brimstone: 2 } },
  { id: "recipe_set_archmage_cloth_wrist", station: "forge", result: "set_archmage_cloth_wrist", desc: "Наручи архимага", floor: 5, dropChance: 0.05, materials: { void_crystal: 1, infernal_ash: 2 } },
  { id: "recipe_set_archmage_cloth_hands", station: "forge", result: "set_archmage_cloth_hands", desc: "Перчатки архимага", floor: 5, dropChance: 0.05, materials: { void_crystal: 1, infernal_ash: 2 } },
  { id: "recipe_set_archmage_cloth_waist", station: "forge", result: "set_archmage_cloth_waist", desc: "Пояс архимага", floor: 5, dropChance: 0.05, materials: { void_crystal: 1, infernal_ash: 2 } },
  { id: "recipe_set_archmage_cloth_legs", station: "forge", result: "set_archmage_cloth_legs", desc: "Штаны архимага", floor: 5, dropChance: 0.05, materials: { void_crystal: 2, infernal_ash: 3 } },
  { id: "recipe_set_archmage_cloth_feet", station: "forge", result: "set_archmage_cloth_feet", desc: "Сапоги архимага", floor: 5, dropChance: 0.05, materials: { void_crystal: 2, infernal_ash: 2 } },

  // ══════════════════════════════════════════════════════════════════════════
  // РЕЦЕПТЫ ПАР: 20 предметов (только ресурсы своего этажа)
  // ══════════════════════════════════════════════════════════════════════════
  { id: "recipe_ring_iron_1", station: "jewelry", result: "ring_iron_1", desc: "Железное кольцо «Заря»", floor: 1, dropChance: 0.05, materials: { iron_ore: 2, malachite: 1 } },
  { id: "recipe_ring_iron_2", station: "jewelry", result: "ring_iron_2", desc: "Железное кольцо «Закат»", floor: 1, dropChance: 0.05, materials: { iron_ore: 3, rust: 1 } },
  { id: "recipe_trinket_wolf_1", station: "jewelry", result: "trinket_wolf_1", desc: "Тотем волка «Клык»", floor: 1, dropChance: 0.05, materials: { wood: 2, leather: 2 } },
  { id: "recipe_trinket_wolf_2", station: "jewelry", result: "trinket_wolf_2", desc: "Тотем волка «Лапа»", floor: 1, dropChance: 0.05, materials: { wood: 2, cloth: 2 } },
  { id: "recipe_ring_copper_1", station: "jewelry", result: "ring_copper_1", desc: "Медное кольцо «Искра»", floor: 2, dropChance: 0.05, materials: { copper_ore: 3, kobold_gear: 1 } },
  { id: "recipe_ring_copper_2", station: "jewelry", result: "ring_copper_2", desc: "Медное кольцо «Жар»", floor: 2, dropChance: 0.05, materials: { copper_ore: 1, tin_ore: 2, kobold_gear: 1 } },
  { id: "recipe_trinket_mushroom_1", station: "jewelry", result: "trinket_mushroom_1", desc: "Грибной амулет «Бледный»", floor: 2, dropChance: 0.05, materials: { cave_mushroom: 3, tin_ore: 1 } },
  { id: "recipe_trinket_mushroom_2", station: "jewelry", result: "trinket_mushroom_2", desc: "Грибной амулет «Тёмный»", floor: 2, dropChance: 0.05, materials: { cave_mushroom: 3, cold_iron_ingot: 1 } },
  { id: "recipe_ring_silver_1", station: "jewelry", result: "ring_silver_1", desc: "Серебряное кольцо «Луна»", floor: 3, dropChance: 0.05, materials: { silver: 2, bone: 1 } },
  { id: "recipe_ring_silver_2", station: "jewelry", result: "ring_silver_2", desc: "Серебряное кольцо «Тень»", floor: 3, dropChance: 0.05, materials: { silver: 3, bone: 1, rune_dust: 1 } },
  { id: "recipe_trinket_ghost_1", station: "jewelry", result: "trinket_ghost_1", desc: "Фиал призрака «Шёпот»", floor: 3, dropChance: 0.05, materials: { rune_dust: 3, silver: 1 } },
  { id: "recipe_trinket_ghost_2", station: "jewelry", result: "trinket_ghost_2", desc: "Фиал призрака «Холод»", floor: 3, dropChance: 0.05, materials: { rune_dust: 3, cursed_cloth: 1, silver: 1 } },
  { id: "recipe_ring_mithril_1", station: "jewelry", result: "ring_mithril_1", desc: "Мифриловое кольцо «Блеск»", floor: 4, dropChance: 0.05, materials: { mithril_ore: 3, war_crystal: 1 } },
  { id: "recipe_ring_mithril_2", station: "jewelry", result: "ring_mithril_2", desc: "Мифриловое кольцо «Песнь»", floor: 4, dropChance: 0.05, materials: { mithril_ore: 3, orc_tusk: 1, war_crystal: 1 } },
  { id: "recipe_trinket_orc_1", station: "jewelry", result: "trinket_orc_1", desc: "Амулет орка «Череп»", floor: 4, dropChance: 0.05, materials: { orc_tusk: 3, iron_chain: 2 } },
  { id: "recipe_trinket_orc_2", station: "jewelry", result: "trinket_orc_2", desc: "Амулет орка «Клык»", floor: 4, dropChance: 0.05, materials: { orc_tusk: 3, blood_herb: 2 } },
  { id: "recipe_ring_hell_1", station: "jewelry", result: "ring_hell_1", desc: "Кольцо из адского камня «Уголёк»", floor: 5, dropChance: 0.05, materials: { hellstone: 3, demon_horn: 1 } },
  { id: "recipe_ring_hell_2", station: "jewelry", result: "ring_hell_2", desc: "Кольцо из адского камня «Пламя»", floor: 5, dropChance: 0.05, materials: { hellstone: 3, void_crystal: 1 } },
  { id: "recipe_trinket_demon_1", station: "jewelry", result: "trinket_demon_1", desc: "Печать демона «Зола»", floor: 5, dropChance: 0.05, materials: { demon_horn: 3, brimstone: 2 } },
  { id: "recipe_trinket_demon_2", station: "jewelry", result: "trinket_demon_2", desc: "Печать демона «Уголь»", floor: 5, dropChance: 0.05, materials: { demon_horn: 3, void_crystal: 1, infernal_ash: 2 } },
];

const RECIPE_MAP = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

function getRecipeById(id) { return RECIPE_MAP[id] || null; }
function getRecipes(station) { return RECIPES.filter((r) => r.station === station); }

// ══════════════════════════════════════════════════════════════════════════
// СЕТЫ И ПАРЫ. Пороги брони — 2/4/6/8 (8 слотов), пар — 2/2.
// Бонусы по типу брони (складываются по достигнутым порогам):
//   кожа    — уворот, крит, шанс дропа, скорость (контратака);
//   ткань   — мана, HP-реген, максимум HP;
//   кольчуга— HP, защита, зоны блока;
//   латы    — защита, снижение урона, зоны блока.
// Ключи бонусов: dodge, crit, lootChance, counterBonus, manaBonus, hpRegen,
// maxHpFlat, maxHpMult, def, blockZones, damageReduction, atkMult, lifesteal,
// goldBonus.
// ══════════════════════════════════════════════════════════════════════════
const SET_BONUS_TEMPLATES = {
  leather: { 2: { dodge: 3 }, 4: { crit: 2 }, 6: { lootChance: 5 }, 8: { dodge: 5, counterBonus: 5 } },
  cloth:   { 2: { manaBonus: 20 }, 4: { hpRegen: 2 }, 6: { maxHpFlat: 40 }, 8: { manaBonus: 25, hpRegen: 3 } },
  chain:   { 2: { maxHpFlat: 30 }, 4: { def: 4 }, 6: { blockZones: 1 }, 8: { def: 6, maxHpFlat: 60 } },
  plate:   { 2: { def: 3 }, 4: { damageReduction: 6 }, 6: { blockZones: 1 }, 8: { def: 5, damageReduction: 10 } },
};

const SETS = {
  // ── 20 сетов брони (4 типа × 5 тиров × 8 слотов) ──
  set_rough_iron: {
    name: "Грубое железо", type: "plate", tier: 1,
    items: ["head_iron", "shoulder_iron", "dented_plate", "wrist_iron", "hands_iron", "waist_plate", "legs_iron", "feet_iron"],
    bonuses: SET_BONUS_TEMPLATES.plate,
  },
  set_coarse_leather: {
    name: "Из грубой кожи", type: "leather", tier: 1,
    items: ["head_leather", "shoulder_leather", "wanderer_coat", "wrist_leather", "hands_gloves", "waist_leather", "legs_leather", "feet_leather"],
    bonuses: SET_BONUS_TEMPLATES.leather,
  },
  set_novice_cloth: {
    name: "Послушник", type: "cloth", tier: 1,
    items: ["head_cloth", "shoulder_cloth", "student_robe", "wrist_cloth", "hands_cloth", "waist_rope", "legs_cloth", "feet_cloth"],
    bonuses: SET_BONUS_TEMPLATES.cloth,
  },
  set_rough_chain: {
    name: "Грубая кольчуга", type: "chain", tier: 1,
    items: ["set_rough_chain_head", "set_rough_chain_shoulder", "iron_chainmail", "set_rough_chain_wrist", "set_rough_chain_hands", "set_rough_chain_waist", "set_rough_chain_legs", "set_rough_chain_feet"],
    bonuses: SET_BONUS_TEMPLATES.chain,
  },
  set_steel_plate: {
    name: "Сталь", type: "plate", tier: 2,
    items: ["steel_head", "steel_shoulder", "steel_chest", "steel_wrist", "steel_hands", "steel_waist", "steel_legs", "steel_feet"],
    bonuses: SET_BONUS_TEMPLATES.plate,
  },
  set_steel_chain: {
    name: "Стальная кольчуга", type: "chain", tier: 2,
    items: ["set_steel_chain_head", "set_steel_chain_shoulder", "steel_chainmail", "set_steel_chain_wrist", "set_steel_chain_hands", "set_steel_chain_waist", "set_steel_chain_legs", "set_steel_chain_feet"],
    bonuses: SET_BONUS_TEMPLATES.chain,
  },
  set_miner: {
    name: "Тёмная кожа", type: "leather", tier: 2,
    items: ["set_miner_head", "set_miner_shoulder", "set_miner_chest", "set_miner_wrist", "set_miner_hands", "set_miner_waist", "set_miner_legs", "set_miner_feet"],
    bonuses: SET_BONUS_TEMPLATES.leather,
  },
  set_apprentice_cloth: {
    name: "Подмастерье", type: "cloth", tier: 2,
    items: ["hood_mage", "set_apprentice_cloth_shoulder", "dense_cloth", "set_apprentice_cloth_wrist", "set_apprentice_cloth_hands", "set_apprentice_cloth_waist", "set_apprentice_cloth_legs", "set_apprentice_cloth_feet"],
    bonuses: SET_BONUS_TEMPLATES.cloth,
  },
  set_guard: {
    name: "Руническая сталь", type: "plate", tier: 3,
    items: ["set_guard_head", "set_guard_shoulder", "set_guard_chest", "set_guard_wrist", "set_guard_hands", "set_guard_waist", "set_guard_legs", "set_guard_feet"],
    bonuses: SET_BONUS_TEMPLATES.plate,
  },
  set_runic_chain: {
    name: "Руническая кольчуга", type: "chain", tier: 3,
    items: ["set_runic_chain_head", "set_runic_chain_shoulder", "set_runic_chain_chest", "set_runic_chain_wrist", "set_runic_chain_hands", "set_runic_chain_waist", "set_runic_chain_legs", "set_runic_chain_feet"],
    bonuses: SET_BONUS_TEMPLATES.chain,
  },
  set_runic_leather: {
    name: "Руническая кожа", type: "leather", tier: 3,
    items: ["set_runic_leather_head", "set_runic_leather_shoulder", "set_runic_leather_chest", "set_runic_leather_wrist", "set_runic_leather_hands", "set_runic_leather_waist", "set_runic_leather_legs", "set_runic_leather_feet"],
    bonuses: SET_BONUS_TEMPLATES.leather,
  },
  set_adept_cloth: {
    name: "Адепт", type: "cloth", tier: 3,
    items: ["set_adept_cloth_head", "set_adept_cloth_shoulder", "set_adept_cloth_chest", "set_adept_cloth_wrist", "set_adept_cloth_hands", "set_adept_cloth_waist", "set_adept_cloth_legs", "set_adept_cloth_feet"],
    bonuses: SET_BONUS_TEMPLATES.cloth,
  },
  set_mithril: {
    name: "Мифрил", type: "plate", tier: 4,
    items: ["mithril_head", "mithril_shoulder", "mithril_chest", "mithril_wrist", "mithril_hands", "mithril_waist", "mithril_legs", "mithril_feet"],
    bonuses: SET_BONUS_TEMPLATES.plate,
  },
  set_mithril_chain: {
    name: "Мифриловая кольчуга", type: "chain", tier: 4,
    items: ["set_mithril_chain_head", "set_mithril_chain_shoulder", "set_mithril_chain_chest", "set_mithril_chain_wrist", "set_mithril_chain_hands", "set_mithril_chain_waist", "set_mithril_chain_legs", "set_mithril_chain_feet"],
    bonuses: SET_BONUS_TEMPLATES.chain,
  },
  set_bone_leather: {
    name: "Кожа с костяными пластинами", type: "leather", tier: 4,
    items: ["set_bone_leather_head", "set_bone_leather_shoulder", "set_bone_leather_chest", "set_bone_leather_wrist", "set_bone_leather_hands", "set_bone_leather_waist", "set_bone_leather_legs", "set_bone_leather_feet"],
    bonuses: SET_BONUS_TEMPLATES.leather,
  },
  set_mage_cloth: {
    name: "Маг", type: "cloth", tier: 4,
    items: ["set_mage_cloth_head", "set_mage_cloth_shoulder", "set_mage_cloth_chest", "set_mage_cloth_wrist", "set_mage_cloth_hands", "set_mage_cloth_waist", "set_mage_cloth_legs", "set_mage_cloth_feet"],
    bonuses: SET_BONUS_TEMPLATES.cloth,
  },
  set_hellblade: {
    name: "Бездна", type: "plate", tier: 5,
    items: ["set_hellblade_head", "set_hellblade_shoulder", "set_hellblade_chest", "set_hellblade_wrist", "set_hellblade_hands", "set_hellblade_waist", "set_hellblade_legs", "set_hellblade_feet"],
    bonuses: SET_BONUS_TEMPLATES.plate,
  },
  set_abyss_chain: {
    name: "Кольчуга Бездны", type: "chain", tier: 5,
    items: ["set_abyss_chain_head", "set_abyss_chain_shoulder", "set_abyss_chain_chest", "set_abyss_chain_wrist", "set_abyss_chain_hands", "set_abyss_chain_waist", "set_abyss_chain_legs", "set_abyss_chain_feet"],
    bonuses: SET_BONUS_TEMPLATES.chain,
  },
  set_abyss_leather: {
    name: "Кожа Бездны", type: "leather", tier: 5,
    items: ["set_abyss_leather_head", "set_abyss_leather_shoulder", "set_abyss_leather_chest", "set_abyss_leather_wrist", "set_abyss_leather_hands", "set_abyss_leather_waist", "set_abyss_leather_legs", "set_abyss_leather_feet"],
    bonuses: SET_BONUS_TEMPLATES.leather,
  },
  set_archmage_cloth: {
    name: "Архимаг", type: "cloth", tier: 5,
    items: ["set_archmage_cloth_head", "set_archmage_cloth_shoulder", "set_archmage_cloth_chest", "set_archmage_cloth_wrist", "set_archmage_cloth_hands", "set_archmage_cloth_waist", "set_archmage_cloth_legs", "set_archmage_cloth_feet"],
    bonuses: SET_BONUS_TEMPLATES.cloth,
  },

  // ── 10 пар (порог 2/2): кольца и аксессуары ──
  pair_iron_rings: {
    name: "Железные кольца", pair: true, tier: 1,
    items: ["ring_iron_1", "ring_iron_2"], bonuses: { 2: { crit: 2 } },
  },
  pair_copper_rings: {
    name: "Медные кольца", pair: true, tier: 2,
    items: ["ring_copper_1", "ring_copper_2"], bonuses: { 2: { crit: 3 } },
  },
  pair_silver_rings: {
    name: "Серебряные кольца", pair: true, tier: 3,
    items: ["ring_silver_1", "ring_silver_2"], bonuses: { 2: { dodge: 4 } },
  },
  pair_mithril_rings: {
    name: "Мифриловые кольца", pair: true, tier: 4,
    items: ["ring_mithril_1", "ring_mithril_2"], bonuses: { 2: { crit: 6 } },
  },
  pair_hell_rings: {
    name: "Кольца Бездны", pair: true, tier: 5,
    items: ["ring_hell_1", "ring_hell_2"], bonuses: { 2: { crit: 8 } },
  },
  pair_wolf_trinkets: {
    name: "Тотемы волка", pair: true, tier: 1,
    items: ["trinket_wolf_1", "trinket_wolf_2"], bonuses: { 2: { dodge: 2 } },
  },
  pair_mushroom_trinkets: {
    name: "Грибные амулеты", pair: true, tier: 2,
    items: ["trinket_mushroom_1", "trinket_mushroom_2"], bonuses: { 2: { maxHpFlat: 25 } },
  },
  pair_ghost_trinkets: {
    name: "Фиалы призрака", pair: true, tier: 3,
    items: ["trinket_ghost_1", "trinket_ghost_2"], bonuses: { 2: { maxHpFlat: 40 } },
  },
  pair_orc_trinkets: {
    name: "Амулеты орка", pair: true, tier: 4,
    items: ["trinket_orc_1", "trinket_orc_2"], bonuses: { 2: { dodge: 4 } },
  },
  pair_demon_trinkets: {
    name: "Печати демона", pair: true, tier: 5,
    items: ["trinket_demon_1", "trinket_demon_2"], bonuses: { 2: { maxHpFlat: 60 } },
  },
};

const SET_MAP = Object.fromEntries(Object.entries(SETS).map(([id, set]) => [id, { id, ...set }]));

// ── Экспорт для bundler/Node (не влияет на браузер) ────────────────────────
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    gearItem, RARITY_TIERS, AFFIXES, UNIQUE_EFFECTS, LIFESTEAL_PERCENT, THORNS_PERCENT,
    ITEMS, SETS, SET_MAP, SET_BONUS_TEMPLATES, ARMOR_TYPE_BY_ID, RARITY_ORDER,
    CHEST_SCRAP_COST, CHEST_TRADER, CHEST_TYPES,
    RECIPES, RECIPE_MAP,
    shopFloorFor, weaponDamageFor, weaponStyleValue, weaponStyleMult, weaponBestStyle,
    getRecipeById, getRecipes,
  };
}

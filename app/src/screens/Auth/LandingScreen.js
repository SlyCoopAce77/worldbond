import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Animated, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { WorldMark } from '../../components/BondLogo';

const { width: SW, height: SH } = Dimensions.get('window');

const AMBER   = '#FF0080';
const AMBER_D = '#CC0060';

// ─── City lights [xFrac, yFrac, tier] ────────────────────────────────────────
const LIGHTS = [
  [0.14,0.30,1],[0.13,0.37,1],[0.15,0.39,1],[0.17,0.40,0],
  [0.19,0.42,1],[0.21,0.33,1],[0.22,0.40,0],[0.22,0.44,0],
  [0.24,0.35,2],[0.23,0.32,0],[0.18,0.46,1],[0.20,0.37,0],
  [0.25,0.51,0],[0.24,0.57,1],[0.27,0.48,0],
  [0.30,0.60,2],[0.29,0.68,1],[0.27,0.69,0],
  [0.46,0.32,1],[0.47,0.29,2],[0.48,0.27,0],[0.48,0.30,2],
  [0.50,0.28,1],[0.49,0.27,0],[0.51,0.23,0],[0.52,0.27,0],
  [0.51,0.33,1],[0.52,0.32,0],[0.55,0.33,0],[0.56,0.24,1],
  [0.45,0.37,0],
  [0.57,0.38,1],[0.57,0.37,0],[0.61,0.37,0],[0.61,0.42,1],
  [0.49,0.48,1],[0.52,0.54,0],[0.57,0.52,0],[0.54,0.63,1],
  [0.68,0.40,1],[0.70,0.37,2],[0.73,0.40,1],[0.69,0.42,1],
  [0.71,0.46,0],[0.73,0.44,0],
  [0.75,0.45,1],[0.76,0.50,1],[0.77,0.54,0],[0.79,0.41,1],
  [0.77,0.32,2],[0.79,0.36,2],[0.80,0.33,2],[0.81,0.33,2],
  [0.81,0.35,1],[0.75,0.37,0],
  [0.84,0.67,1],[0.83,0.70,0],
];

const WIRE_PAIRS = (() => {
  const pairs = [], T = 0.14;
  for (let i = 0; i < LIGHTS.length; i++)
    for (let j = i + 1; j < LIGHTS.length; j++) {
      const dx = LIGHTS[i][0]-LIGHTS[j][0], dy = LIGHTS[i][1]-LIGHTS[j][1];
      if (dx*dx+dy*dy < T*T) pairs.push([i,j]);
    }
  return pairs;
})();

const STARS = [
  [0.03,0.03,0.55],[0.07,0.07,0.35],[0.11,0.02,0.45],[0.02,0.13,0.30],[0.08,0.17,0.40],
  [0.97,0.04,0.50],[0.93,0.02,0.35],[0.89,0.08,0.45],[0.98,0.14,0.30],[0.92,0.18,0.40],
  [0.04,0.90,0.40],[0.09,0.94,0.30],[0.02,0.97,0.50],[0.14,0.92,0.35],
  [0.96,0.91,0.45],[0.91,0.96,0.30],[0.98,0.97,0.40],[0.86,0.93,0.35],
  [0.01,0.30,0.25],[0.02,0.46,0.20],[0.01,0.62,0.30],[0.03,0.78,0.22],
  [0.99,0.28,0.25],[0.98,0.46,0.20],[0.99,0.62,0.30],[0.97,0.78,0.22],
  [0.36,0.24,0.20],[0.38,0.35,0.18],[0.35,0.48,0.15],[0.37,0.18,0.22],
];

const ACTIVE_BONDS = [
  [ 8,19,   0,6000],[ 2,52, 900,7500],[19,34,2200,5500],[34,46,3500,6800],
  [15,19,1600,8000],[40,21,4100,7000],[52,50, 500,4500],[46,55,2900,9000],
  [ 8,15,3800,7200],[31,35,5300,8500],
];

// ─── Line renderer ────────────────────────────────────────────────────────────
function AbsLine({ x1, y1, x2, y2, color, opacity = 0.05, h: lh = 1 }) {
  const dx = x2-x1, dy = y2-y1;
  const len = Math.sqrt(dx*dx+dy*dy);
  const angle = Math.atan2(dy,dx)*180/Math.PI;
  return (
    <View pointerEvents="none" style={{
      position:'absolute', width:len, height:lh,
      backgroundColor:color, opacity,
      left:(x1+x2)/2-len/2, top:(y1+y2)/2-lh/2,
      transform:[{rotate:`${angle}deg`}],
    }} />
  );
}

// ─── One rotating earth tile ──────────────────────────────────────────────────
function EarthLayer({ w, h, pulses, color }) {
  const pts = LIGHTS.map(([px,py]) => ({ x:px*w, y:py*h }));
  return (
    <View pointerEvents="none" style={{ width:w, height:h }}>

      {/* Wire mesh — near-invisible geographic whisper */}
      {WIRE_PAIRS.map(([a,b],i) => (
        <AbsLine key={`w${i}`}
          x1={pts[a].x} y1={pts[a].y} x2={pts[b].x} y2={pts[b].y}
          color="#6070A0" opacity={0.022} />
      ))}

      {/* Live bond flashes */}
      {ACTIVE_BONDS.map(([a,b],i) => {
        const dx=pts[b].x-pts[a].x, dy=pts[b].y-pts[a].y;
        const len=Math.sqrt(dx*dx+dy*dy);
        const angle=Math.atan2(dy,dx)*180/Math.PI;
        const opacity=pulses[i].interpolate({inputRange:[0,1],outputRange:[0,0.44]});
        return (
          <Animated.View key={`p${i}`} pointerEvents="none" style={{
            position:'absolute', width:len, height:1.5,
            backgroundColor:color,
            left:(pts[a].x+pts[b].x)/2-len/2,
            top:(pts[a].y+pts[b].y)/2-0.75,
            transform:[{rotate:`${angle}deg`}],
            opacity,
          }} />
        );
      })}

      {/* Mega-city glow halos */}
      {pts.map((p,i) => {
        if (LIGHTS[i][2]!==2) return null;
        return (
          <View key={`g${i}`} pointerEvents="none" style={{
            position:'absolute', width:24, height:24, borderRadius:12,
            backgroundColor:'#FFD060', opacity:0.055,
            left:p.x-12, top:p.y-12,
          }} />
        );
      })}

      {/* City lights — warm white satellite spectrum */}
      {pts.map((p,i) => {
        const tier=LIGHTS[i][2];
        const sz=tier===2?5.5:tier===1?3:1.8;
        const op=tier===2?0.90:tier===1?0.60:0.30;
        const lc=tier===2?'#FFF8E0':tier===1?'#FFE4A0':'#FFCC70';
        return (
          <View key={`n${i}`} pointerEvents="none" style={{
            position:'absolute', width:sz, height:sz, borderRadius:sz/2,
            backgroundColor:lc, opacity:op,
            left:p.x-sz/2, top:p.y-sz/2,
          }} />
        );
      })}
    </View>
  );
}

// ─── Rotating earth background — two tiles, seamless slow loop ────────────────
function EarthNightBg({ w, h, color }) {
  const pulses = useRef(ACTIVE_BONDS.map(()=>new Animated.Value(0))).current;
  const rotX   = useRef(new Animated.Value(0)).current;

  useEffect(()=>{
    pulses.forEach((val,i)=>{
      const [,,delay,period]=ACTIVE_BONDS[i];
      const cycle=()=>{
        val.setValue(0);
        Animated.sequence([
          Animated.timing(val,{toValue:1,duration:650,delay,useNativeDriver:true}),
          Animated.timing(val,{toValue:0,duration:1300,useNativeDriver:true}),
          Animated.timing(val,{toValue:0,duration:Math.max(100,period-delay-1950),useNativeDriver:true}),
        ]).start(()=>cycle());
      };
      setTimeout(cycle,i*180);
    });
    // 200 seconds per full revolution — slow, cinematic drift
    Animated.loop(
      Animated.timing(rotX,{toValue:1,duration:200000,useNativeDriver:true})
    ).start();
  },[]);

  const translateX=rotX.interpolate({inputRange:[0,1],outputRange:[0,-w]});

  return (
    <View pointerEvents="none" style={{position:'absolute',width:w,height:h,overflow:'hidden'}}>
      {/* Stars — fixed in space, never rotate */}
      <View style={{position:'absolute',width:w,height:h}}>
        {STARS.map(([sx,sy,op],i)=>(
          <View key={`s${i}`} pointerEvents="none" style={{
            position:'absolute', width:1.5, height:1.5, borderRadius:1,
            backgroundColor:'#fff', opacity:op,
            left:sx*w-0.75, top:sy*h-0.75,
          }}/>
        ))}
      </View>
      {/* Two earth tiles rotating slowly left */}
      <Animated.View style={{
        position:'absolute', width:w*2, height:h,
        flexDirection:'row', transform:[{translateX}],
      }}>
        <EarthLayer w={w} h={h} pulses={pulses} color={color}/>
        <EarthLayer w={w} h={h} pulses={pulses} color={color}/>
      </Animated.View>
    </View>
  );
}

// ─── Animated hero mark ───────────────────────────────────────────────────────
const MARK_W = 120;
function HeroWorldMark() {
  const leftDraw  = useRef(new Animated.Value(0)).current;
  const rightDraw = useRef(new Animated.Value(0)).current;
  const bondPop   = useRef(new Animated.Value(0)).current;
  const bondGlow  = useRef(new Animated.Value(0)).current;
  const breathe   = useRef(new Animated.Value(0.97)).current;

  useEffect(()=>{
    Animated.sequence([
      Animated.timing(leftDraw, {toValue:1,duration:700,delay:150,useNativeDriver:true}),
      Animated.timing(rightDraw,{toValue:1,duration:700,useNativeDriver:true}),
      Animated.spring(bondPop,  {toValue:1,friction:5,tension:80,useNativeDriver:true}),
    ]).start(()=>{
      Animated.loop(Animated.sequence([
        Animated.timing(bondGlow,{toValue:1,duration:2200,useNativeDriver:true}),
        Animated.timing(bondGlow,{toValue:0,duration:2200,useNativeDriver:true}),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(breathe,{toValue:1.04,duration:5000,useNativeDriver:true}),
        Animated.timing(breathe,{toValue:0.97,duration:5000,useNativeDriver:true}),
      ])).start();
    });
  },[]);

  const bondScale   = bondPop.interpolate({inputRange:[0,1],outputRange:[0,1]});
  const glowOpacity = bondGlow.interpolate({inputRange:[0,1],outputRange:[0.07,0.30]});
  const glowScale   = bondGlow.interpolate({inputRange:[0,1],outputRange:[1,1.8]});
  const GLOW_R=38, bondY=MARK_W*0.46;

  return (
    <View style={{marginBottom:28,alignItems:'center',width:MARK_W,height:MARK_W}}>
      <Animated.View style={{
        position:'absolute', width:GLOW_R*2, height:GLOW_R*2, borderRadius:GLOW_R,
        backgroundColor:AMBER, left:MARK_W/2-GLOW_R, top:bondY-GLOW_R,
        opacity:glowOpacity, transform:[{scale:glowScale}],
      }}/>
      <Animated.View style={{transform:[{scale:breathe}]}}>
        <WorldMark size={MARK_W} color="#fff" bondColor={AMBER} worldColor="#fff"
          strandColor="#fff" drawProgress={[leftDraw,rightDraw]}
          bondScale={bondScale} strokeWidth={2.6}/>
      </Animated.View>
    </View>
  );
}

// ─── Live signal dot ──────────────────────────────────────────────────────────
function LiveSignalDot() {
  const blink=useRef(new Animated.Value(1)).current;
  useEffect(()=>{
    Animated.loop(Animated.sequence([
      Animated.timing(blink,{toValue:0.2,duration:900,useNativeDriver:true}),
      Animated.timing(blink,{toValue:1,  duration:900,useNativeDriver:true}),
    ])).start();
  },[]);
  return (
    <Animated.View style={{width:6,height:6,borderRadius:3,backgroundColor:AMBER,opacity:blink}}/>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function LandingScreen({ onGetStarted, onSignIn }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(36)).current;
  const ctaFade   = useRef(new Animated.Value(0)).current;
  const ctaSlide  = useRef(new Animated.Value(20)).current;

  useEffect(()=>{
    Animated.parallel([
      Animated.timing(fadeAnim, {toValue:1,duration:700,useNativeDriver:true}),
      Animated.spring(slideAnim,{toValue:0,friction:9,tension:45,useNativeDriver:true}),
    ]).start();
    Animated.parallel([
      Animated.timing(ctaFade, {toValue:1,duration:600,delay:1400,useNativeDriver:true}),
      Animated.spring(ctaSlide,{toValue:0,friction:8,tension:40,useNativeDriver:true,delay:1400}),
    ]).start();
  },[]);

  return (
    <LinearGradient colors={['#000000','#010101','#000000']} style={s.container}>
      <EarthNightBg w={SW} h={SH} color={AMBER}/>
      <SafeAreaView style={s.safe}>

        <Animated.View style={[s.hero,{opacity:fadeAnim,transform:[{translateY:slideAnim}]}]}>
          <HeroWorldMark/>
          <View style={s.appName}>
            <Text style={s.appNameWorld}>WORLD</Text>
            <Text style={s.appNameBond}>BOND</Text>
          </View>
        </Animated.View>

        <Animated.View style={[s.signalRow,{opacity:fadeAnim}]}>
          <LiveSignalDot/>
          <Text style={s.signalText}>Live bonds across 150+ countries</Text>
        </Animated.View>

        <Animated.View style={[s.ctas,{opacity:ctaFade,transform:[{translateY:ctaSlide}]}]}>
          <TouchableOpacity onPress={onGetStarted} activeOpacity={0.85} style={s.primaryBtn}>
            <LinearGradient colors={[AMBER,AMBER_D]} start={{x:0,y:0}} end={{x:1,y:1}} style={s.primaryGrad}>
              <Text style={s.primaryText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSignIn} activeOpacity={0.7} style={s.secondaryBtn}>
            <Text style={s.secondaryText}>Sign in</Text>
          </TouchableOpacity>
        </Animated.View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container:    { flex:1 },
  safe:         { flex:1, alignItems:'center', justifyContent:'space-between', paddingVertical:58, paddingHorizontal:28 },
  hero:         { alignItems:'center' },
  appName:      { alignItems:'center' },
  appNameWorld: { color:'#fff', opacity:0.80, fontSize:13, fontWeight:'500', letterSpacing:6.5, lineHeight:16 },
  appNameBond:  { color:AMBER, fontSize:52, fontWeight:'900', letterSpacing:-2, lineHeight:56 },
  signalRow:    { flexDirection:'row', alignItems:'center', gap:8 },
  signalText:   { color:'#ffffff', opacity:0.45, fontSize:12, fontWeight:'600', letterSpacing:0.5 },
  ctas:         { width:'100%', gap:14 },
  primaryBtn:   { borderRadius:20, overflow:'hidden', shadowColor:AMBER, shadowOpacity:0.5, shadowRadius:24, shadowOffset:{width:0,height:8} },
  primaryGrad:  { paddingVertical:20, alignItems:'center', borderRadius:20 },
  primaryText:  { color:'#fff', fontSize:17, fontWeight:'800', letterSpacing:0.3 },
  secondaryBtn: { paddingVertical:12, alignItems:'center' },
  secondaryText:{ color:'#ffffff', opacity:0.40, fontSize:15, fontWeight:'500', letterSpacing:0.2 },
});

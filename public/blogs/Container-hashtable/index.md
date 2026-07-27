## 基本原理

`Hashtable`称为哈希表或散列表，是**在有高效存取需求但空间有限的条件下出现的**：

* 空间足够时，可以将存储元素所有的可能取值都与`key`一一对应，这样在查询时拥有`O(1)`的时间复杂度
* 空间不足时，无论如何分配`key`，必然导致若干值共享相同的`key`，称之为**哈希碰撞**

![](/blogs/Container-hashtable/829a01491302aa67.png)

在发生碰撞时使用新的规则二次甚至多次分配`key`，不仅会导致存取时间增加，而且新的分配也可能导致新的碰撞，使用上也并不直观（同一`key`下的多个值得到`key`的方式可能大相径庭）

因此目前普遍采用的方式是**`Separate Chaining`，即分离链表**，发生碰撞的值之间通过指针串联起来形成一个`list`，虽然`list`是线性搜索时间，但如果哈希表分配均匀，各个`list`足够小，查询速度依然会很快

![](/blogs/Container-hashtable/d6a910959d724a17.png)

目前**普遍采用的计算`key`的方式为`n % m`**，其中`m`为`bucket`数量，通常取质数，`n`为存储元素的值对应的一个哈希码（HashCode）；经验上，**当存储元素总数超过`bucket`数量时**，代表着`Hashtable`需要成长、扩充空间

`Hashtable`成长时，**一般将`bucket`数量扩充为近似两倍大的另一个质数**，在 GCC2.9 中这样的数列为 **53** / 97 / 193 / 389 / 769 / 1543 / 3079 / 6151......；扩充后，原`Hashtable`中的所有值均要进行再分配（rehashing），形成新的分离链表结构

## Hashtable-GCC2.9

构建一个`Hashtable`需要传入六个模板参数，其中**`HashFcn`用来将存储元素计算为 HashCode**，而`ExtractKey`以及`EqualKey`分别和`Rb_tree`中的`KeyOfValue`以及`Compare`发挥的作用类似（详见[[STL 8] | Container-5-红黑树Rb_tree](https://past-blog.vercel.app/blog/Container-rb_tree)）

```c++
template <typename Value, typename Key, typename HashFcn,
typename ExtactKey, typename EqualKey, typename Alloc = alloc>
class hashtable {
public:
    typedef HashFcn hasher;
    typedef EqualKey key_equal;
    typedef size_t size_type;
private:
    hasher hash;
    key_equal equals;
    ExtractKey get_key;
    
    typedef __hashtable_node<Value> node;
    vector<node*, Alloc> buckets;
    size_type num_elements;
public:
    size_type bucket_count() const
    { return buckets.size(); }
    ...
};
template <typename Value>
struct __hashtable_node {
    __hashtable_node* next;
    Value val;
};
// ------------------------------------------------------
template <typename Value, typename Key, typename HashFcn,
typename ExtactKey, typename EqualKey, typename Alloc = alloc>
struct __hashtable_iterator {
    ...
    node* cur;
    hashtable* ht;
};
```

* 可以看到主要元素由`hash`、`equals`、`get_key`、`buckets`和`num_elements`构成，其中前三个均为仿函数，实际各占用 1 字节大小，`buckets`是一个`Vector`至少占用 12 字节大小（详见[[STL 4] | Container-2-动态数组Vector](https://past-blog.vercel.app/blog/Container-vector)），因此**一个`Hashtable`至少占用的空间大小为$3 + 12 + 4 = 19\rightarrow 20$ 字节**（32-bit系统）

* 哈希表节点除了有数据本身还有一个指向下一节点的指针，即**单向链表节点**

* `Hashtable`的`iterator`中含有一个指向哈希表本身的指针，作用类似于`Deque`中的当前索引节点指针`node`（详见[[STL 6] | Container-4-双向队列Deque](https://past-blog.vercel.app/blog/Container-deque)），可以让`line 31`的`cur`移动到链表尾端后进行正常跳转；可以使用`Hashtable`的`iterator`改变元素的`data`，但是不能改变元素的`key`

* `Hashtable`的一个定义示例：

    ```c++
    hashtabe<const char*, const char*, hash<const char*>,
    identity<const char*>, eqstr, alloc>
    ht(50, hash<const char*>(), eqstr());
    // ------------------------------------------------------
    struct eqstr {
        bool operator()(const char* s1, const char* s2) const
        { return strcmp(s1, s2) == 0; }
    };
    ```

## HashFcn以及HashCode

`HashFcn`的设计需要**将存储元素映射为尽可能分散的`HashCode`数值**，越分散越随机就越不容易发生碰撞，GCC2.9中对`hash`这一哈希函数的实现如下：

```c++
template <typename Key> struct hash {  };
__STL_TEMPLATE_NULL struct hash<char> {
    size_t operator()(char x) const { return x; }
};
__STL_TEMPLATE_NULL struct hash<short> {
    size_t operator()(short x) const { return x; }
};
__STL_TEMPLATE_NULL struct hash<unsigned short> {
    size_t operator()(unsigned short x) const { return x; }
};
__STL_TEMPLATE_NULL struct hash<int> {
    size_t operator()(int x) const { return x; }
};
__STL_TEMPLATE_NULL struct hash<unsigned int> {
    size_t operator()(unsigned int x) const { return x; }
};
__STL_TEMPLATE_NULL struct hash<long> {
    size_t operator()(long x) const { return x; }
};
__STL_TEMPLATE_NULL struct hash<unsigned long> {
    size_t operator()(unsigned long x) const { return x; }
};
__STL_TEMPLATE_NULL struct hash<char*> {
    size_t operator()(const char* s) const { return __stl_hash_string(s); }
};
__STL_TEMPLATE_NULL struct hash<const char*> {
    size_t operator()(const char* s) const { return __stl_hash_string(s); }
};
```

* 其中`__STL_TEMPLATE_NULL`即为`template<>`，底层仅对偏特化版本进行了实现，且**对于数值类型的元素只是简单地返回自身用作`HashCode`**

* 对于字符以及字符串类型，则遍历每个字符并将其 ASCII 码值迭代式地加乘 5 ，最终结果作为`HashCode`

    ```c++
    inline size_t __stl_hash_string(const char* s) {
        unsigned long h = 0;
        for (; *s; ++s)
            h = 5 * h + *s;
        return size_t(h);
    }
    ```

---

而如何根据`HashCode`计算出存储元素最终的`key`（即**`modulus`运算**），标准库中均调用下面的函数实现：

```c++
size_type bkt_num_key(const key_type& key, size_t n) const 
{ return hash(key) % n; }
```

* 这里的`hash`指的是`hashtable::hash`，即传入的`HashFcn`